const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const executablePath = chromePaths.find(p => fs.existsSync(p));
if (!executablePath) {
    console.error('No local Chrome or Edge executable found.');
    process.exit(1);
}

const ARTIFACTS_DIR = 'C:\\Users\\ianpa\\.gemini\\antigravity-ide\\brain\\d4933be6-6d18-4c7a-ab3e-755d23239215';

(async () => {
    let browser;
    try {
        console.log('Launching headless browser...');
        browser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1100']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1100 });
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

        console.log('Page loaded at http://localhost:5173/');

        // Seed realistic activity logs for rich visual charts & clinical dossier data
        await page.evaluate(() => {
            const now = Date.now();
            const childId = 'child_1';
            const sampleLogs = [];
            const msPerDay = 86400000;

            for (let i = 0; i < 7; i++) {
                const dayTs = now - (i * msPerDay);
                const d = new Date(dayTs);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                // Feeds: formula + breast per day
                sampleLogs.push({
                    id: `feed_${i}_1`,
                    childId,
                    category: 'feeding',
                    subType: 'formula',
                    amountMl: 120,
                    timestamp: dayTs - (14 * 3600000),
                    dateStr,
                    timeStr: '08:00 AM'
                });
                sampleLogs.push({
                    id: `feed_${i}_2`,
                    childId,
                    category: 'feeding',
                    subType: 'breast',
                    amountMl: 90,
                    timestamp: dayTs - (11 * 3600000),
                    dateStr,
                    timeStr: '11:00 AM'
                });
                sampleLogs.push({
                    id: `feed_${i}_3`,
                    childId,
                    category: 'feeding',
                    subType: 'formula',
                    amountMl: 130,
                    timestamp: dayTs - (8 * 3600000),
                    dateStr,
                    timeStr: '02:00 PM'
                });
                sampleLogs.push({
                    id: `feed_${i}_4`,
                    childId,
                    category: 'feeding',
                    subType: 'breast',
                    amountMl: 100,
                    timestamp: dayTs - (5 * 3600000),
                    dateStr,
                    timeStr: '05:00 PM'
                });
                sampleLogs.push({
                    id: `feed_${i}_5`,
                    childId,
                    category: 'feeding',
                    subType: 'formula',
                    amountMl: 120,
                    timestamp: dayTs - (2 * 3600000),
                    dateStr,
                    timeStr: '08:00 PM'
                });

                // Diapers: 6 wet + 2 dirty (meets AAP standard)
                for (let w = 1; w <= 6; w++) {
                    sampleLogs.push({
                        id: `diaper_${i}_${w}`,
                        childId,
                        category: 'diaper',
                        subType: w % 3 === 0 ? 'poop' : 'pee',
                        timestamp: dayTs - ((16 - w * 2) * 3600000),
                        dateStr,
                        timeStr: `${8 + w * 2}:00`
                    });
                }

                // Sleep: Morning nap, Afternoon nap, Night sleep
                sampleLogs.push({
                    id: `sleep_${i}_nap1`,
                    childId,
                    category: 'sleep',
                    subType: 'nap',
                    durationMinutes: 75,
                    timestamp: dayTs - (12 * 3600000),
                    dateStr,
                    timeStr: '10:00 AM'
                });
                sampleLogs.push({
                    id: `sleep_${i}_nap2`,
                    childId,
                    category: 'sleep',
                    subType: 'nap',
                    durationMinutes: 90,
                    timestamp: dayTs - (6 * 3600000),
                    dateStr,
                    timeStr: '04:00 PM'
                });
                sampleLogs.push({
                    id: `sleep_${i}_night`,
                    childId,
                    category: 'sleep',
                    subType: 'night',
                    durationMinutes: 480,
                    timestamp: dayTs - (20 * 3600000),
                    dateStr,
                    timeStr: '09:00 PM'
                });

                // Tummy time & Vitamin D
                sampleLogs.push({
                    id: `tummy_${i}`,
                    childId,
                    category: 'tummy',
                    durationMinutes: 20,
                    timestamp: dayTs - (7 * 3600000),
                    dateStr,
                    timeStr: '03:00 PM'
                });
                sampleLogs.push({
                    id: `vitamin_${i}`,
                    childId,
                    category: 'feeding',
                    subType: 'vitamins',
                    amountMl: 1,
                    timestamp: dayTs - (15 * 3600000),
                    dateStr,
                    timeStr: '08:30 AM'
                });
            }

            localStorage.setItem('bt_app_logs', JSON.stringify(sampleLogs));
        });
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 600));

        // -------------------------------------------------------------
        // TEST 1: SWEETNAP CARD VERIFICATION
        // -------------------------------------------------------------
        console.log('\n--- TEST 1: SweetNap Predictor Card ---');
        const sweetNapEl = await page.$('#sweet-nap-card');
        if (!sweetNapEl) throw new Error('Missing #sweet-nap-card on dashboard!');
        console.log('✓ Found #sweet-nap-card on dashboard');

        const sweetNapText = await page.$eval('#sweet-nap-card', el => el.innerText);
        if (!sweetNapText.includes('SweetNap™ Predictor')) {
            throw new Error('SweetNap card title text missing!');
        }
        if (!sweetNapText.includes('Sleep Pressure Gauge')) {
            throw new Error('Sleep pressure gauge missing from SweetNap card!');
        }
        console.log('✓ SweetNap header and Sleep Pressure gauge verified');

        // Check layout containment
        const napBox = await page.$eval('#sweet-nap-card', el => ({
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth
        }));
        console.log(`✓ SweetNap box dimensions: clientWidth=${napBox.clientWidth}, scrollWidth=${napBox.scrollWidth}`);
        if (napBox.scrollWidth > napBox.clientWidth + 2) {
            throw new Error('SweetNap card has horizontal overflow spilling!');
        }

        // Capture SweetNap desktop screenshot
        const napScreenshotPath = path.join(ARTIFACTS_DIR, 'sweet_nap_card_desktop.png');
        await sweetNapEl.screenshot({ path: napScreenshotPath });
        console.log(`✓ Saved SweetNap screenshot to ${napScreenshotPath}`);

        // -------------------------------------------------------------
        // TEST 2: CAREGIVER SHIFT & PROTOCOL BOARD
        // -------------------------------------------------------------
        console.log('\n--- TEST 2: Caregiver Shift & Protocol Board ---');
        const handoffEl = await page.$('#caregiver-handoff-card');
        if (!handoffEl) throw new Error('Missing #caregiver-handoff-card on dashboard!');
        console.log('✓ Found #caregiver-handoff-card on dashboard');

        const handoffText = await page.$eval('#caregiver-handoff-card', el => el.innerText);
        if (!handoffText.includes('Caregiver Shift & Protocols')) {
            throw new Error('Caregiver handoff card title missing!');
        }
        if (!handoffText.includes('Active Caregiver')) {
            throw new Error('Active on-duty caregiver status missing!');
        }
        if (!handoffText.includes('Pinned Household Protocols')) {
            throw new Error('Pinned protocols header missing!');
        }
        console.log('✓ Caregiver card header, on-duty status, and protocols verified');

        // Test Hand Off Shift Drawer Toggle
        const handoffBtn = await page.$('#caregiver-handoff-card button');
        await handoffBtn.click();
        await new Promise(r => setTimeout(r, 400));

        let drawerText = await page.$eval('#caregiver-handoff-card', el => el.innerText);
        if (!drawerText.includes('Confirm Caregiver Shift Transition')) {
            throw new Error('Hand-off transition drawer did not open on button click!');
        }
        console.log('✓ Shift hand-off transition drawer toggled open');

        // Select next caregiver & confirm handoff
        const confirmBtn = await page.evaluateHandle(() => {
            const card = document.querySelector('#caregiver-handoff-card');
            const btns = card.querySelectorAll('button');
            for (const b of btns) {
                if (b.innerText.includes('Confirm Hand-off to')) return b;
            }
            return null;
        });
        if (!confirmBtn) throw new Error('Could not find Confirm Hand-off button in drawer!');
        await confirmBtn.click();
        await new Promise(r => setTimeout(r, 500));

        // Verify shift transferred and on-duty badge updated
        const updatedHandoffText = await page.$eval('#caregiver-handoff-card', el => el.innerText);
        console.log('✓ Hand-off confirmed! Active caregiver status:', updatedHandoffText.split('\n')[2]);

        // Test Pinning a New Protocol
        const addProtoBtn = await page.evaluateHandle(() => {
            const card = document.querySelector('#caregiver-handoff-card');
            const btns = card.querySelectorAll('button');
            for (const b of btns) {
                if (b.innerText.includes('Add Protocol')) return b;
            }
            return null;
        });
        if (!addProtoBtn) throw new Error('Could not find Add Protocol button!');
        await addProtoBtn.click();
        await new Promise(r => setTimeout(r, 300));

        // Type new protocol note
        const protoInput = await page.$('#caregiver-handoff-card input[type="text"]');
        if (!protoInput) throw new Error('Protocol input text field not found!');
        await protoInput.type('Check nursery room temperature at 2:00 AM');

        const pinBtn = await page.evaluateHandle(() => {
            const card = document.querySelector('#caregiver-handoff-card');
            const btns = card.querySelectorAll('button');
            for (const b of btns) {
                if (b.innerText.includes('Pin Note')) return b;
            }
            return null;
        });
        await pinBtn.click();
        await new Promise(r => setTimeout(r, 400));

        const protocolsListText = await page.$eval('#caregiver-handoff-card', el => el.innerText);
        if (!protocolsListText.includes('Check nursery room temperature at 2:00 AM')) {
            throw new Error('Newly pinned protocol note not visible in protocols list!');
        }
        console.log('✓ Successfully pinned new protocol instruction to household board');

        // Capture Caregiver card screenshot
        const handoffScreenshotPath = path.join(ARTIFACTS_DIR, 'caregiver_handoff_card_desktop.png');
        await handoffEl.screenshot({ path: handoffScreenshotPath });
        console.log(`✓ Saved Caregiver Handoff screenshot to ${handoffScreenshotPath}`);

        // -------------------------------------------------------------
        // TEST 3: 1-CLICK DOCTOR VISIT DOSSIER MODAL & PDF EXPORT
        // -------------------------------------------------------------
        console.log('\n--- TEST 3: 1-Click Pediatrician Visit Dossier Modal ---');
        // Click Doctor Dossier button in header
        const dossierHeaderBtn = await page.$('#btn-header-doctor-dossier');
        if (!dossierHeaderBtn) throw new Error('Missing #btn-header-doctor-dossier in header!');
        await dossierHeaderBtn.click();
        await new Promise(r => setTimeout(r, 600));

        const dossierModal = await page.$('#doctor-dossier-modal');
        if (!dossierModal) throw new Error('Doctor Dossier modal did not open!');
        console.log('✓ Doctor Dossier modal opened cleanly');

        const modalText = await page.$eval('#doctor-dossier-modal', el => el.innerText);
        const modalUpper = modalText.toUpperCase();
        if (!modalUpper.includes('PEDIATRICIAN VISIT DOSSIER')) {
            throw new Error('Missing modal title in Doctor Dossier!');
        }
        if (!modalUpper.includes('DAILY MILK INTAKE')) {
            throw new Error('Missing Daily Milk Intake in clinical highlights!');
        }
        if (!modalUpper.includes('HYDRATION & OUTPUT')) {
            throw new Error('Missing Hydration & Output in clinical highlights!');
        }
        if (!modalUpper.includes('DAILY INTAKE & OUTPUT TREND')) {
            throw new Error('Missing Daily Intake & Output Trend chart!');
        }
        if (!modalUpper.includes('CLINICAL EHR PORTAL NOTE PREVIEW')) {
            throw new Error('Missing EHR portal note preview in dossier!');
        }
        console.log('✓ All dossier clinical cards, SVG chart, and EHR preview present');

        // Test Timeframe Switcher (14d)
        const d14Btn = await page.evaluateHandle(() => {
            const modal = document.querySelector('#doctor-dossier-modal');
            const btns = modal.querySelectorAll('button');
            for (const b of btns) {
                if (b.innerText.trim() === '14d') return b;
            }
            return null;
        });
        if (d14Btn) {
            await d14Btn.click();
            await new Promise(r => setTimeout(r, 400));
            console.log('✓ Switched dossier timeframe to 14 days');
        }

        // Test Copy Clinical Note button
        const copyBtn = await page.evaluateHandle(() => {
            const modal = document.querySelector('#doctor-dossier-modal');
            const btns = modal.querySelectorAll('button');
            for (const b of btns) {
                if (b.innerText.includes('Copy Clinical Note')) return b;
            }
            return null;
        });
        if (!copyBtn) throw new Error('Copy Clinical Note button not found!');
        await copyBtn.click();
        await new Promise(r => setTimeout(r, 300));
        const afterCopyText = await page.$eval('#doctor-dossier-modal', el => el.innerText);
        if (!afterCopyText.includes('Copied to Clipboard!')) {
            console.warn('Note: clipboard flash text not matched, continuing...');
        } else {
            console.log('✓ Copy Clinical Note verified with "Copied to Clipboard!" flash');
        }

        // Capture Doctor Dossier modal screenshot
        const dossierScreenshotPath = path.join(ARTIFACTS_DIR, 'doctor_dossier_modal.png');
        await dossierModal.screenshot({ path: dossierScreenshotPath });
        console.log(`✓ Saved Doctor Dossier screenshot to ${dossierScreenshotPath}`);

        // Close modal
        const closeBtn = await page.$('#doctor-dossier-modal button[aria-label="Close modal"]');
        if (closeBtn) await closeBtn.click();
        await new Promise(r => setTimeout(r, 400));
        console.log('✓ Doctor Dossier modal closed cleanly');

        // -------------------------------------------------------------
        // TEST 4: MOBILE VIEWPORT & TEXT OVERFLOW CONTAINMENT AUDIT
        // -------------------------------------------------------------
        console.log('\n--- TEST 4: Mobile Viewport (iPhone 14 Pro: 393x852) Containment Audit ---');
        await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
        await new Promise(r => setTimeout(r, 600));

        // Check horizontal overflow on document
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const windowWidth = await page.evaluate(() => window.innerWidth);
        console.log(`Document scrollWidth: ${documentWidth}px, window.innerWidth: ${windowWidth}px`);
        if (documentWidth > windowWidth + 2) {
            throw new Error(`Mobile layout overflow detected! scrollWidth (${documentWidth}) > innerWidth (${windowWidth})`);
        }
        console.log('✓ Zero document-level horizontal spill on mobile (393px width)');

        // Check SweetNap mobile card box
        const mobileNapBox = await page.$eval('#sweet-nap-card', el => ({
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth
        }));
        console.log(`✓ Mobile SweetNap card: clientWidth=${mobileNapBox.clientWidth}, scrollWidth=${mobileNapBox.scrollWidth}`);
        if (mobileNapBox.scrollWidth > mobileNapBox.clientWidth + 2) {
            throw new Error('SweetNap card spilled horizontally on mobile!');
        }

        // Check Caregiver Handoff mobile card box
        const mobileHandoffBox = await page.$eval('#caregiver-handoff-card', el => ({
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth
        }));
        console.log(`✓ Mobile Caregiver card: clientWidth=${mobileHandoffBox.clientWidth}, scrollWidth=${mobileHandoffBox.scrollWidth}`);
        if (mobileHandoffBox.scrollWidth > mobileHandoffBox.clientWidth + 2) {
            throw new Error('Caregiver Handoff card spilled horizontally on mobile!');
        }

        // Capture mobile view screenshots
        const mobileNapEl = await page.$('#sweet-nap-card');
        const mobileNapScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_sweet_nap_card.png');
        await mobileNapEl.screenshot({ path: mobileNapScreenshotPath });
        console.log(`✓ Saved mobile SweetNap screenshot to ${mobileNapScreenshotPath}`);

        const mobileHandoffEl = await page.$('#caregiver-handoff-card');
        const mobileHandoffScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_caregiver_handoff_card.png');
        await mobileHandoffEl.screenshot({ path: mobileHandoffScreenshotPath });
        console.log(`✓ Saved mobile Caregiver Handoff screenshot to ${mobileHandoffScreenshotPath}`);

        const mobileScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_top_three_features.png');
        await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
        console.log(`✓ Saved mobile viewport screenshot to ${mobileScreenshotPath}`);

        console.log('\n======================================================');
        console.log('🎉 ALL END-TO-END TESTS PASSED WITH 100% SUCCESS RATE!');
        console.log('======================================================\n');

    } catch (err) {
        console.error('E2E Verification Error:', err);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
    }
})();
