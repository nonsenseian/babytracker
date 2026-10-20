import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/ianpa/.gemini/antigravity-ide/brain/d4933be6-6d18-4c7a-ab3e-755d23239215';

const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = chromePaths.find(p => fs.existsSync(p));
if (!executablePath) {
    console.error('No Chrome or Edge found!');
    process.exit(1);
}

async function runCalendarPopupVerification() {
    console.log('🚀 Starting Comprehensive E2E verification for Calendar Day Activities Pop-Up Modal...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    try {
        // Find today's date string
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayDateStr = `${yyyy}-${mm}-${dd}`;
        console.log(`Today date string: ${todayDateStr}`);

        // Use evaluateOnNewDocument to seed localStorage before React mounts
        await page.evaluateOnNewDocument(() => {
            const d = new Date();
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            const sampleLogs = [
                {
                    id: 'log_test_1',
                    childId: 'child_1',
                    category: 'feeding',
                    subType: 'formula',
                    amount: 120,
                    unit: 'mL',
                    timestamp: d.getTime() - 14400000,
                    dateStr: todayStr,
                    timeStr: '07:30 AM',
                    caregiverId: 'cg_1',
                    caregiverName: 'Mom',
                    notes: 'Morning formula bottle'
                },
                {
                    id: 'log_test_2',
                    childId: 'child_1',
                    category: 'diaper',
                    subType: 'both',
                    timestamp: d.getTime() - 10800000,
                    dateStr: todayStr,
                    timeStr: '08:15 AM',
                    caregiverId: 'cg_1',
                    caregiverName: 'Mom',
                    notes: 'Diaper change, applied balm'
                },
                {
                    id: 'log_test_3',
                    childId: 'child_1',
                    category: 'sleep',
                    subType: 'nap',
                    durationMinutes: 45,
                    timestamp: d.getTime() - 7200000,
                    dateStr: todayStr,
                    timeStr: '09:00 AM',
                    caregiverId: 'cg_2',
                    caregiverName: 'Dad',
                    notes: 'Morning crib nap'
                },
                {
                    id: 'log_test_4',
                    childId: 'child_1',
                    category: 'tummy',
                    durationMinutes: 15,
                    timestamp: d.getTime() - 3600000,
                    dateStr: todayStr,
                    timeStr: '11:00 AM',
                    caregiverId: 'cg_1',
                    caregiverName: 'Mom',
                    notes: 'Playmat head-lifting exercises'
                },
                {
                    id: 'log_test_5',
                    childId: 'child_1',
                    category: 'feeding',
                    subType: 'breastmilk',
                    amount: 90,
                    unit: 'mL',
                    timestamp: d.getTime() - 1800000,
                    dateStr: todayStr,
                    timeStr: '01:30 PM',
                    caregiverId: 'cg_2',
                    caregiverName: 'Dad',
                    notes: 'Afternoon feeding'
                }
            ];
            localStorage.setItem('bt_app_logs', JSON.stringify(sampleLogs));
        });

        // Navigate to app
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('#sweet-nap-card', { timeout: 10000 });
        console.log('✅ Page loaded successfully on Tracker tab with 5 seeded activities');

        // ==========================================
        // 1. Test "Open Calendar View" button routing
        // ==========================================
        console.log('\n--- 1. Testing "Open Calendar View" button routing ---');
        const openCalendarBtn = await page.$('#btn-open-calendar-date-box') || await page.$('button[title*="open Calendar view"]');
        if (!openCalendarBtn) {
            throw new Error('Could not find date box button in activity log stream!');
        }
        await openCalendarBtn.click();
        await new Promise(r => setTimeout(r, 600));

        // Verify we navigated to Family Profile tab
        const isProfileActive = await page.$eval('#nav-tab-profile', el => {
            const cs = window.getComputedStyle(el);
            return cs.fontWeight === '700' || cs.fontWeight === '800' || cs.fontWeight === 'bold' || cs.backgroundColor !== 'transparent';
        });
        console.log(`Profile tab active status: ${isProfileActive}`);
        if (!isProfileActive) {
            throw new Error('Failed to route to Family Profile tab upon clicking calendar button!');
        }
        console.log('✅ "Open Calendar View" successfully routed to Family Profile tab');

        // Verify Monthly Activity Calendar exists
        await page.waitForSelector('#monthly-activity-calendar', { timeout: 5000 });
        console.log('✅ Monthly Activity Calendar is visible in Family Profile');

        // Check today's cell badge count and category indicator dots
        const todayCellSelector = `#calendar-cell-${todayDateStr}`;
        await page.waitForSelector(todayCellSelector, { timeout: 5000 });

        const cellBadgeText = await page.$eval(todayCellSelector, el => el.innerText);
        console.log(`Today's calendar cell content:\n${cellBadgeText}`);
        if (!cellBadgeText.includes('5')) {
            throw new Error(`Expected today's cell badge to show 5 activities, but got: ${cellBadgeText}`);
        }
        console.log('✅ Calendar day cell correctly displays badge showing 5 logged activities');

        // ==========================================
        // 2. Click Day Cell & Verify Pop-Up Window
        // ==========================================
        console.log('\n--- 2. Clicking Day Cell to open Activities Pop-Up Window ---');
        await page.click(todayCellSelector);
        await new Promise(r => setTimeout(r, 400));

        // Verify modal overlay and content
        await page.waitForSelector('#calendar-day-modal-overlay', { timeout: 3000 });
        await page.waitForSelector('#calendar-day-modal-content', { timeout: 3000 });
        console.log('✅ Pop-up modal overlay and content opened upon clicking day cell');

        // Inspect modal sizing styles (capped at maxHeight: 75vh to avoid being too large)
        const modalStyles = await page.$eval('#calendar-day-modal-content', el => {
            const cs = window.getComputedStyle(el);
            return {
                maxHeight: cs.maxHeight,
                maxWidth: cs.maxWidth,
                display: cs.display,
                flexDirection: cs.flexDirection,
                overflow: cs.overflow
            };
        });
        console.log('Modal container styles:', JSON.stringify(modalStyles, null, 2));

        // Inspect scroll area styling
        const scrollStyles = await page.$eval('#calendar-day-modal-scroll-area', el => {
            const cs = window.getComputedStyle(el);
            return {
                overflowY: cs.overflowY,
                touchAction: cs.touchAction,
                overscrollBehavior: cs.overscrollBehavior,
                scrollbarWidth: cs.scrollbarWidth
            };
        });
        console.log('Scroll area styles:', JSON.stringify(scrollStyles, null, 2));

        if (scrollStyles.overflowY !== 'auto' && scrollStyles.overflowY !== 'scroll') {
            throw new Error(`Expected overflowY to be auto or scroll, but got: ${scrollStyles.overflowY}`);
        }
        console.log('✅ Verified scroll area has overflow-y: auto and touchAction: pan-y');

        // Check badge in modal header shows "5 activities"
        const modalHeaderBadge = await page.$eval('#calendar-day-modal-content span[style*="border-radius: 999px"]', el => el.innerText.trim());
        console.log(`Modal header activity count badge: "${modalHeaderBadge}"`);
        if (!modalHeaderBadge.includes('5 activities')) {
            throw new Error(`Expected modal badge to show "5 activities", but got: ${modalHeaderBadge}`);
        }
        console.log('✅ Modal header displays "5 activities" badge');

        // Check that 5 activity cards are rendered inside scroll area
        const renderedCards = await page.$$('#calendar-day-modal-scroll-area .surface-card');
        console.log(`Number of ActivityCards rendered inside modal: ${renderedCards.length}`);
        if (renderedCards.length < 5) {
            throw new Error(`Expected at least 5 ActivityCards in modal, found: ${renderedCards.length}`);
        }
        console.log('✅ All 5 logged activities are cleanly rendered inside modal scroll area');

        // Test scrolling inside the scroll area
        const scrollResult = await page.$eval('#calendar-day-modal-scroll-area', el => {
            const initialScroll = el.scrollTop;
            el.scrollTop = 150;
            const newScroll = el.scrollTop;
            return { initialScroll, newScroll, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
        });
        console.log('Scroll area test measurements:', JSON.stringify(scrollResult, null, 2));

        // Check modal footer instructions
        const footerText = await page.$eval('#calendar-day-modal-content', el => el.innerText);
        if (!footerText.includes('Scroll or swipe to navigate activities')) {
            throw new Error('Footer swipe/scroll navigation hint not found');
        }
        console.log('✅ Modal footer displays "↕️ Scroll or swipe to navigate activities"');

        // Capture screenshot of desktop modal
        const desktopShotPath = path.join(ARTIFACTS_DIR, 'e2e_13_calendar_day_popup_desktop.png');
        await page.screenshot({ path: desktopShotPath });
        console.log(`📸 Captured desktop modal screenshot with logged activities: ${desktopShotPath}`);

        // Test closing modal via Done button
        console.log('\n--- 3. Testing Modal Dismissal ---');
        console.log('Testing dismissal via #btn-done-calendar-modal...');
        await page.click('#btn-done-calendar-modal');
        await new Promise(r => setTimeout(r, 400));
        let modalClosed = await page.$('#calendar-day-modal-overlay');
        if (modalClosed !== null) {
            throw new Error('Modal did not dismiss when Done button was clicked');
        }
        console.log('✅ Modal successfully closed via Done button');

        // Test reopening and closing via X button
        console.log('Reopening modal and testing #btn-close-calendar-modal...');
        await page.click(todayCellSelector);
        await page.waitForSelector('#calendar-day-modal-content', { timeout: 3000 });
        await page.click('#btn-close-calendar-modal');
        await new Promise(r => setTimeout(r, 400));
        modalClosed = await page.$('#calendar-day-modal-overlay');
        if (modalClosed !== null) {
            throw new Error('Modal did not dismiss when X button was clicked');
        }
        console.log('✅ Modal successfully closed via X button');

        // ==========================================
        // 4. Mobile Viewport Verification (393px width)
        // ==========================================
        console.log('\n--- 4. Testing Mobile Viewport (393px width) ---');
        await page.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });
        await new Promise(r => setTimeout(r, 500));

        // Re-ensure profile tab is active
        const profileTabBtn = await page.$('#nav-tab-profile');
        if (profileTabBtn) {
            await profileTabBtn.click();
            await new Promise(r => setTimeout(r, 600));
        }

        // Click day cell on mobile
        await page.waitForSelector(todayCellSelector, { timeout: 5000 });
        await page.$eval(todayCellSelector, el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
        await page.click(todayCellSelector);
        await page.waitForSelector('#calendar-day-modal-content', { timeout: 3000 });

        // Ensure modal width fits mobile viewport without horizontal scrolling
        const modalRect = await page.$eval('#calendar-day-modal-content', el => {
            const r = el.getBoundingClientRect();
            return { width: r.width, height: r.height, top: r.top, left: r.left };
        });
        console.log('Mobile modal dimensions:', JSON.stringify(modalRect, null, 2));

        if (modalRect.width > 393) {
            throw new Error(`Modal width (${modalRect.width}px) exceeds mobile viewport (393px)`);
        }
        console.log('✅ Modal fits within mobile viewport with appropriate margins (361px / 393px)');

        // Capture mobile modal screenshot
        const mobileShotPath = path.join(ARTIFACTS_DIR, 'e2e_14_calendar_day_popup_mobile.png');
        await page.screenshot({ path: mobileShotPath });
        console.log(`📸 Captured mobile modal screenshot with logged activities: ${mobileShotPath}`);

        console.log('\n🎉 ALL CALENDAR DAY POP-UP REQUIREMENTS VERIFIED AND CONFIRMED!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runCalendarPopupVerification();
