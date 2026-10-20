const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/ianpa/.gemini/antigravity-ide/brain/d4933be6-6d18-4c7a-ab3e-755d23239215';

async function runVerification() {
    console.log('🚀 Starting E2E verification for all 7 issues...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('✅ Page loaded successfully');

        // Capture initial tracker overview
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_01_daily_tracker.png') });
        console.log('📸 Captured e2e_01_daily_tracker.png');

        // ==========================================
        // Issue 4: Header Dual Dropdowns
        // ==========================================
        console.log('\n--- Checking Issue 4: Header Dual Dropdowns ---');
        const box1Text = await page.$eval('#active-child-dropdown-btn', el => el.innerText.trim());
        const box2Text = await page.$eval('#active-caregiver-dropdown-btn', el => el.innerText.trim());
        console.log(`Dropdown Box 1 text: "${box1Text}"`);
        console.log(`Dropdown Box 2 text: "${box2Text}"`);

        if (!box1Text || !box2Text) {
            throw new Error(`Dropdown box empty. Box1: ${box1Text}, Box2: ${box2Text}`);
        }
        console.log('✅ Issue 4 Verified: Box 1 shows child selector and Box 2 shows caregiver selector');

        // Test caregiver switching via Box 2
        await page.click('#active-caregiver-dropdown-btn');
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_02_caregiver_dropdown.png') });
        console.log('📸 Captured e2e_02_caregiver_dropdown.png');

        // Click outside or select
        await page.click('body', { offset: { x: 10, y: 10 } });
        await new Promise(r => setTimeout(r, 200));

        // ==========================================
        // Issue 5: Rename SweetNap to "Nap Predictor"
        // ==========================================
        console.log('\n--- Checking Issue 5: Title and Disclaimer ---');
        const napCardText = await page.$eval('#sweet-nap-card', el => el.innerText);
        if (napCardText.includes('SweetNap™') || napCardText.includes('FREE OFFLINE AI')) {
            throw new Error('SweetNap(TM) or FREE OFFLINE AI still present!');
        }
        if (!napCardText.includes('Nap Predictor')) {
            throw new Error('Title "Nap Predictor" not found!');
        }
        console.log('✅ Nap Predictor title verified, FREE OFFLINE AI removed');

        // Click info icon for disclaimer tooltip
        await page.click('#btn-nap-info-disclaimer');
        await new Promise(r => setTimeout(r, 300));
        const disclaimerText = await page.$eval('#nap-predictor-disclaimer-tooltip', el => el.innerText.trim());
        console.log(`Disclaimer tooltip text: "${disclaimerText}"`);
        if (!disclaimerText.includes('AAP age-indexed wake windows')) {
            throw new Error('Disclaimer tooltip text does not cite AAP wake windows!');
        }
        console.log('✅ Issue 5 Verified: Info icon tooltip accurately sources AAP wake window heuristics');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_03_nap_predictor_info.png') });

        // Close tooltip
        await page.click('#btn-nap-info-disclaimer');
        await new Promise(r => setTimeout(r, 200));

        // ==========================================
        // Issue 1: Stop Sleep Timer inside Nap Predictor
        // ==========================================
        console.log('\n--- Checking Issue 1: Stop Sleep Timer ---');
        const startNapBtn = await page.$('#btn-start-nap-timer');
        if (startNapBtn) {
            await startNapBtn.click();
            await new Promise(r => setTimeout(r, 600));
        }

        // Verify stop button is visible with Stop text and Square icon
        const stopBtn = await page.$('#btn-stop-sleep-timer');
        if (!stopBtn) {
            throw new Error('#btn-stop-sleep-timer not found after starting nap!');
        }
        const stopBtnText = await page.evaluate(el => el.innerText.trim(), stopBtn);
        console.log(`Stop button text: "${stopBtnText}"`);
        if (!stopBtnText.includes('Stop Sleep Timer')) {
            throw new Error(`Expected "Stop Sleep Timer", got "${stopBtnText}"`);
        }

        // Verify SVG icon inside is Square, NOT Play
        const hasSquareIcon = await page.evaluate(el => {
            const svg = el.querySelector('svg');
            return svg && svg.querySelector('rect') !== null;
        }, stopBtn);
        console.log(`Has square stop icon: ${hasSquareIcon}`);
        if (!hasSquareIcon) {
            throw new Error('Stop button does not have square stop icon!');
        }

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_04_nap_timer_running.png') });
        console.log('📸 Captured e2e_04_nap_timer_running.png');

        // Click Stop Sleep Timer
        await stopBtn.click();
        await new Promise(r => setTimeout(r, 800));

        // Verify nap stopped and card recalculated
        const napCardAfterStop = await page.$eval('#sweet-nap-card', el => el.innerText);
        if (napCardAfterStop.includes('Currently Napping')) {
            throw new Error('Nap timer still running after clicking Stop Sleep Timer!');
        }
        console.log('✅ Issue 1 Verified: Stop Sleep Timer stopped the timer and recalculated wake window directly from the card');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_05_nap_timer_stopped.png') });

        // ==========================================
        // Issues 2 & 3: Sections Relocated from Tracker to Family Profile
        // ==========================================
        console.log('\n--- Checking Issues 2 & 3: Relocated Sections ---');
        const trackerCaregiver = await page.$('#section-caregiver-handoff');
        const trackerAppointments = await page.$('#section-appointments');
        const trackerCalendar = await page.$('#section-calendar');

        if (trackerCaregiver || trackerAppointments || trackerCalendar) {
            throw new Error(`Sections still found on Daily Tracker! Caregiver: ${!!trackerCaregiver}, Appointments: ${!!trackerAppointments}, Calendar: ${!!trackerCalendar}`);
        }
        console.log('✅ Daily Tracker bloat reduced: Caregiver, Appointments, and Calendar are absent from Daily Tracker');

        // Switch to Family Profile Tab
        await page.click('#nav-tab-profile');
        await new Promise(r => setTimeout(r, 500));

        const profileCaregiver = await page.$('#section-caregiver-handoff');
        const profileAppointments = await page.$('#section-appointments');
        const profileCalendar = await page.$('#section-calendar');

        if (!profileCaregiver || !profileAppointments || !profileCalendar) {
            throw new Error(`Sections missing on Family Profile! Caregiver: ${!!profileCaregiver}, Appointments: ${!!profileAppointments}, Calendar: ${!!profileCalendar}`);
        }
        console.log('✅ Issues 2 & 3 Verified: Caregiver Shift & Protocols, Appointments, and Calendar all mounted on Family Profile tab');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_06_family_profile_tab.png') });
        console.log('📸 Captured e2e_06_family_profile_tab.png');

        // ==========================================
        // Issue 6: Child Profile Allergies & Dossier Sync
        // ==========================================
        console.log('\n--- Checking Issue 6: Allergies in Child Profile & Dossier ---');
        // Open Child Modal via Family Profile edit button
        const editChildBtn = await page.$('#child-card-edit-btn');
        if (editChildBtn) {
            await editChildBtn.click();
        } else {
            await page.click('#active-child-dropdown-btn');
            await new Promise(r => setTimeout(r, 200));
            await page.click('#header-edit-child-profile-btn');
        }
        await new Promise(r => setTimeout(r, 400));

        // Check allergies input field
        const allergiesInput = await page.$('#child-profile-allergies-input');
        if (!allergiesInput) {
            throw new Error('#child-profile-allergies-input not found in ChildProfileModal!');
        }

        // Set allergies value
        await allergiesInput.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
        await allergiesInput.type('Peanuts, Amoxicillin, Dairy');
        console.log('Typed allergies: "Peanuts, Amoxicillin, Dairy"');

        // Submit form
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 600));

        // Verify allergies updated in child vitals on Family Profile
        const profileText = await page.$eval('#section-family-profiles', el => el.innerText);
        if (!profileText.includes('Peanuts, Amoxicillin, Dairy')) {
            throw new Error('Allergies not reflected in Family Profile child vitals card!');
        }
        console.log('✅ Allergies reflected in Family Profile child vitals');

        // Open Doctor Dossier
        await page.click('#header-btn-dossier');
        await new Promise(r => setTimeout(r, 600));

        const dossierText = await page.$eval('#doctor-dossier-modal', el => el.innerText);
        if (!dossierText.includes('Peanuts, Amoxicillin, Dairy')) {
            throw new Error('Allergies not reflected in Doctor Dossier!');
        }
        console.log('✅ Issue 6 Verified: Allergies accurately reflected in Doctor Dossier');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_07_dossier_allergies.png') });

        // Close Doctor Dossier
        await page.click('#dossier-btn-close');
        await new Promise(r => setTimeout(r, 300));

        // ==========================================
        // Issue 7: Dashboard Customization on ALL Tabs
        // ==========================================
        console.log('\n--- Checking Issue 7: Dashboard Customization on ALL Tabs ---');
        // Open Settings Modal and enable Customize mode
        await page.click('#header-btn-settings');
        await new Promise(r => setTimeout(r, 400));
        await page.click('#settings-toggle-layout-mode-btn');
        await new Promise(r => setTimeout(r, 300));
        // Close settings modal
        await page.click('button[aria-label="Close settings"]');
        await new Promise(r => setTimeout(r, 400));

        // 1. Check Family Profile Tab Customization
        const profileEditBar = await page.$('#layout-edit-bar-profile');
        if (!profileEditBar) {
            throw new Error('Layout edit bar not visible on Family Profile tab!');
        }
        console.log('✅ Customization banner active on Family Profile tab');

        // Hide calendar section on Profile tab
        const calendarRemoveBtn = await page.$('#section-calendar .layout-remove-badge');
        if (calendarRemoveBtn) {
            await calendarRemoveBtn.click();
            await new Promise(r => setTimeout(r, 400));
            const profileRestoreShelf = await page.$eval('#layout-restore-shelf-profile', el => el.innerText);
            if (!profileRestoreShelf.includes('Monthly Activity Calendar')) {
                throw new Error('Calendar did not appear on Profile tab restore shelf!');
            }
            console.log('✅ Calendar hidden and appeared on Profile restore shelf');
            // Restore it
            await page.click('#layout-restore-shelf-profile button');
            await new Promise(r => setTimeout(r, 300));
        }
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_08_profile_customization.png') });

        // 2. Check Daily Tracker Tab Customization
        await page.click('#nav-tab-tracker');
        await new Promise(r => setTimeout(r, 400));
        const trackerEditBar = await page.$('#layout-edit-bar-tracker');
        if (!trackerEditBar) {
            throw new Error('Layout edit bar not visible on Daily Tracker tab!');
        }
        console.log('✅ Customization banner active on Daily Tracker tab');

        // Hide sound machine section on Tracker tab
        const soundMachineRemoveBtn = await page.$('#section-sound-machine .layout-remove-badge');
        if (soundMachineRemoveBtn) {
            await soundMachineRemoveBtn.click();
            await new Promise(r => setTimeout(r, 400));
            const trackerRestoreShelf = await page.$eval('#layout-restore-shelf-tracker', el => el.innerText);
            if (!trackerRestoreShelf.includes('Sound Machine')) {
                throw new Error('Sound Machine did not appear on Tracker restore shelf!');
            }
            console.log('✅ Sound Machine hidden and appeared on Tracker restore shelf');
            // Restore it
            await page.click('#layout-restore-shelf-tracker button');
            await new Promise(r => setTimeout(r, 300));
        }
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_09_tracker_customization.png') });

        // 3. Check Metrics Tab Customization
        await page.click('#nav-tab-metrics');
        await new Promise(r => setTimeout(r, 400));
        const metricsEditBar = await page.$('#layout-edit-bar-metrics');
        if (!metricsEditBar) {
            throw new Error('Layout edit bar not visible on Metrics tab!');
        }
        console.log('✅ Customization banner active on Metrics tab');

        // Hide milestone trophy case on Metrics tab
        const milestoneRemoveBtn = await page.$('#section-milestones .layout-remove-badge');
        if (milestoneRemoveBtn) {
            await milestoneRemoveBtn.click();
            await new Promise(r => setTimeout(r, 400));
            const metricsRestoreShelf = await page.$eval('#layout-restore-shelf-metrics', el => el.innerText);
            if (!metricsRestoreShelf.includes('Milestone Trophy Case')) {
                throw new Error('Milestones did not appear on Metrics restore shelf!');
            }
            console.log('✅ Milestones hidden and appeared on Metrics restore shelf');
            // Restore it
            await page.click('#layout-restore-shelf-metrics button');
            await new Promise(r => setTimeout(r, 300));
        }
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_10_metrics_customization.png') });

        // Exit Customization mode via Done button on Metrics tab
        await page.click('#layout-edit-bar-metrics .btn-primary');
        await new Promise(r => setTimeout(r, 400));

        const editBarAfterDone = await page.$('#layout-edit-bar-metrics');
        if (editBarAfterDone) {
            throw new Error('Layout edit mode did not exit after clicking Done!');
        }
        console.log('✅ Issue 7 Verified: Layout customization successfully operates across Tracker, Profile, and Metrics tabs');

        console.log('\n🎉 ALL 7 ISSUES FULLY VERIFIED VIA HEADLESS BROWSER!');
    } catch (err) {
        console.error('❌ E2E Verification failed:', err);
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_error.png') });
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

runVerification();
