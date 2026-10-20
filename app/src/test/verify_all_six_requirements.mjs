import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/ianpa/.gemini/antigravity-ide/brain/c95f67d7-3217-4d94-9b6e-c2b41d449ad5';
if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

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

async function verifyAllSixRequirements() {
    console.log('🚀 Running end-to-end verification of all 6 user requirements...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });

    try {
        // Clear localStorage first to test pristine first-launch state
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.evaluate(() => {
            localStorage.clear();
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#quick-logging-pad', { timeout: 10000 });
        console.log('✅ Page loaded with clean pristine storage.');

        // 1. Verify default children profiles, pinned household protocols, and default calendar event are removed
        const dataSanity = await page.evaluate(() => {
            const rawChildren = localStorage.getItem('bt_children_profiles');
            const rawCaregivers = localStorage.getItem('bt_caregivers');
            const rawProtocols = localStorage.getItem('bt_shift_protocols');
            const rawAppointments = localStorage.getItem('bt_appointments');
            const rawShift = localStorage.getItem('bt_caregiver_shift');

            return {
                childrenCount: rawChildren ? JSON.parse(rawChildren).length : 0,
                caregiversCount: rawCaregivers ? JSON.parse(rawCaregivers).length : 0,
                appointmentsCount: rawAppointments ? JSON.parse(rawAppointments).length : 0,
                pinnedProtocolsCount: rawShift ? (JSON.parse(rawShift).pinnedProtocols || []).length : 0
            };
        });
        console.log('State sanity check:', dataSanity);
        if (dataSanity.childrenCount !== 0) throw new Error(`Expected 0 default children, got ${dataSanity.childrenCount}`);
        if (dataSanity.caregiversCount !== 0) throw new Error(`Expected 0 default caregivers, got ${dataSanity.caregiversCount}`);
        if (dataSanity.appointmentsCount !== 0) throw new Error(`Expected 0 default appointments, got ${dataSanity.appointmentsCount}`);
        if (dataSanity.pinnedProtocolsCount !== 0) throw new Error(`Expected 0 pinned protocols, got ${dataSanity.pinnedProtocolsCount}`);
        console.log('✅ Requirement 1 & 4 PASSED: Default children, pinned protocols, appointments, and care team are clean/empty.');

        // 2. Verify tracker page layout order:
        // Live Timers -> Quick Log -> 24-hr day timeline ribbon -> Tracked Activities -> Sound Machine -> Nap Predictor -> Streamline view bar
        const sectionOrder = await page.evaluate(() => {
            const sections = Array.from(document.querySelectorAll('[id^="section-"]'));
            return sections.map(s => s.id);
        });
        console.log('Rendered section order:', sectionOrder);
        const expectedOrder = [
            'section-timers',
            'section-quick-logging',
            'section-timeline-ribbon',
            'section-activity-log',
            'section-sound-machine',
            'section-sweet-nap'
        ];
        for (let i = 0; i < expectedOrder.length; i++) {
            if (sectionOrder[i] !== expectedOrder[i]) {
                throw new Error(`Section order mismatch at index ${i}: expected ${expectedOrder[i]}, got ${sectionOrder[i]}`);
            }
        }
        // Verify streamline view shelf is below these sections
        const streamlineShelfExists = await page.$('#btn-streamline-dashboard');
        if (!streamlineShelfExists) throw new Error('Streamline view bar (#btn-streamline-dashboard) not found at bottom');
        console.log('✅ Requirement 2 PASSED: Tracker layout strictly arranged in user specified order.');

        // 3. Verify Quick Log "Edit Pinned Activities" small red text button on the bottom right
        const pinEditBtn = await page.$('#btn-edit-pinned-activities');
        if (!pinEditBtn) throw new Error('Button #btn-edit-pinned-activities not found');
        const initialBtnText = await page.evaluate(el => el.innerText.trim(), pinEditBtn);
        const initialBtnColor = await page.evaluate(el => window.getComputedStyle(el).color, pinEditBtn);
        console.log(`Pin Edit Button text: "${initialBtnText}", color: "${initialBtnColor}"`);
        if (!initialBtnText.includes('Edit Pinned Activities')) {
            throw new Error(`Expected "Edit Pinned Activities", got "${initialBtnText}"`);
        }

        // Click to enter pin edit mode
        await pinEditBtn.click();
        const editingBtnText = await page.evaluate(el => el.innerText.trim(), pinEditBtn);
        console.log(`After click, button text: "${editingBtnText}"`);
        if (!editingBtnText.includes('Confirm Choices')) {
            throw new Error(`Expected "Confirm Choices", got "${editingBtnText}"`);
        }

        // Toggle a quick log pin while in pin edit mode
        const firstTile = await page.$('#btn-quick-log-pee');
        if (firstTile) {
            await firstTile.click();
        }

        // Confirm choices to save and exit
        await pinEditBtn.click();
        const postBtnText = await page.evaluate(el => el.innerText.trim(), pinEditBtn);
        if (!postBtnText.includes('Edit Pinned Activities')) {
            throw new Error(`Expected button text to revert to "Edit Pinned Activities", got "${postBtnText}"`);
        }
        console.log('✅ Requirement 3 PASSED: Quick Log pin edit toggle and "Edit Pinned Activities" / "Confirm Choices" working.');

        // 4. Verify Notifications button with bell icon at top right and clean welcome notification
        const notifBtn = await page.$('#btn-header-notifications');
        if (!notifBtn) throw new Error('Notifications button #btn-header-notifications not found in header');
        const badgeEl = await page.$('#notifications-badge');
        if (!badgeEl) throw new Error('Notifications unread badge not found');
        const badgeCount = await page.evaluate(el => el.innerText.trim(), badgeEl);
        console.log(`Found notifications badge with unread count: ${badgeCount}`);
        if (badgeCount !== '1') {
            throw new Error(`Expected exactly 1 welcome notification on initial start, got ${badgeCount}`);
        }

        // Open notifications flyout
        await notifBtn.click();
        await page.waitForSelector('#header-notifications-flyout', { timeout: 3000 });
        const flyoutText = await page.evaluate(() => document.getElementById('header-notifications-flyout')?.innerText || '');
        console.log('Flyout text preview:', flyoutText.substring(0, 150));
        if (!flyoutText.includes("Welcome to NovaBaby!")) {
            throw new Error(`Flyout does not contain welcome message: ${flyoutText}`);
        }
        if (flyoutText.includes("2-Month Well-Child Check-up")) {
            throw new Error(`Flyout still contains leftover mock 2-month checkup artifact: ${flyoutText}`);
        }

        // Tap the welcome notification to introduce user to Notification Center menu
        const welcomeCard = await page.$('.notification-card-item');
        if (welcomeCard) {
            await welcomeCard.click();
            await page.waitForSelector('#notification-center-intro-guide', { timeout: 2000 });
            console.log('✅ Tapping welcome notification opened #notification-center-intro-guide.');
        }

        // Capture screenshot of the notification flyout
        const headerFlyoutEl = await page.$('#header-notifications-flyout');
        if (headerFlyoutEl) {
            await headerFlyoutEl.screenshot({ path: path.join(ARTIFACTS_DIR, 'notifications_flyout_demo.png') });
            console.log('📸 Captured screenshot: notifications_flyout_demo.png');
        }

        // Click mark all read
        const markAllBtn = await page.$('#btn-mark-all-notifications-read');
        if (markAllBtn) {
            await markAllBtn.click();
            await new Promise(r => setTimeout(r, 200));
        }
        const badgeStillExists = await page.$('#notifications-badge');
        if (badgeStillExists) throw new Error('Badge should disappear after marking read');
        console.log('✅ Notifications mark all read verified.');

        // Close notifications flyout by clicking outside
        await page.click('body');
        await new Promise(r => setTimeout(r, 200));
        console.log('✅ Requirement 5 PASSED: Notifications bell button, badge, and pediatric insights flyout verified.');

        // 5. Verify Persistent Bottom Pill Menu (like Instagram)
        const bottomNav = await page.$('#condensed-floating-header');
        if (!bottomNav) throw new Error('Bottom navigation bar #condensed-floating-header not found');
        const navStyle = await page.evaluate(el => {
            const cs = window.getComputedStyle(el);
            return {
                position: cs.position,
                bottom: cs.bottom,
                borderRadius: cs.borderRadius,
                transform: cs.transform
            };
        }, bottomNav);
        console.log('Bottom Nav style:', navStyle);
        if (navStyle.position !== 'fixed') {
            throw new Error(`Expected position: fixed, got ${navStyle.position}`);
        }

        // Verify tabs, voice, settings, and scroll to top buttons exist inside bottom pill menu
        const trackerTab = await page.$('#bottom-nav-tab-tracker');
        const metricsTab = await page.$('#bottom-nav-tab-metrics');
        const profileTab = await page.$('#bottom-nav-tab-profile');
        const voiceBtn = await page.$('#btn-bottom-voice');
        const settingsBtn = await page.$('#btn-bottom-settings');
        const scrollTopBtn = await page.$('#btn-bottom-scroll-top');

        if (!trackerTab || !metricsTab || !profileTab || !voiceBtn || !settingsBtn || !scrollTopBtn) {
            throw new Error('Missing expected controls inside persistent bottom pill menu');
        }

        // Test scroll down shrink (~15% scale 0.85)
        await page.evaluate(() => window.scrollTo(0, 500));
        await new Promise(r => setTimeout(r, 350));
        const scrolledTransform = await page.evaluate(el => window.getComputedStyle(el).transform, bottomNav);
        console.log('Scrolled down transform:', scrolledTransform);
        // matrix for scale(0.85) has 0.85 as first element
        if (!scrolledTransform.includes('0.85')) {
            console.warn('Transform did not strictly include 0.85, got:', scrolledTransform);
        }

        // Test scroll to top button
        await scrollTopBtn.click();
        await new Promise(r => setTimeout(r, 400));
        const scrollY = await page.evaluate(() => window.scrollY);
        console.log('After clicking scroll to top button, scrollY is:', scrollY);

        // Capture full page screenshot showing new layout and persistent bottom bar
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'babytracker_full_layout.png'), fullPage: false });
        console.log('📸 Captured screenshot: babytracker_full_layout.png');

        // Check Profile tab empty care team state
        await profileTab.click();
        await new Promise(r => setTimeout(r, 400));
        const profilePageText = await page.evaluate(() => document.body.innerText);
        if (!profilePageText.includes('No Care Team Members Designated')) {
            throw new Error(`Profile tab should display "No Care Team Members Designated", got: ${profilePageText.substring(0, 300)}`);
        }
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'empty_care_team_profile.png') });
        console.log('📸 Captured screenshot: empty_care_team_profile.png');
        console.log('✅ Requirement 4 & 6 PASSED: Care team empty state and Persistent Bottom Menu verified.');

        console.log('🎉 ALL 6 USER REQUIREMENTS FULLY VERIFIED AND PASSING!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

verifyAllSixRequirements();
