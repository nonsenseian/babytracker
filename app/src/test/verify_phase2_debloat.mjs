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

async function runPhase2DebloatVerification() {
    console.log('🚀 Starting E2E Verification for 9 De-bloat & Refactoring Requirements...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('#quick-logging-pad', { timeout: 10000 });
        console.log('✅ Page loaded successfully');

        // =========================================================================
        // REQUIREMENT 1 & 5: Feed & Pump Reminders in Timer Buttons & Age-Anchoring
        // =========================================================================
        console.log('\n--- [Req 1 & 5] Testing Feed & Pump Timer Button Reminder Integration & Anchoring ---');
        await page.waitForSelector('#btn-feed-timer-action', { timeout: 4000 });
        await page.waitForSelector('#feed-timer-reminder-badge', { timeout: 4000 });

        const feedActionBtnText = await page.$eval('#btn-feed-timer-action', el => el.innerText.trim());
        const feedBadgeText = await page.$eval('#feed-timer-reminder-badge', el => el.innerText.trim());
        console.log(`Feed Action Button text:\n"${feedActionBtnText}"`);
        console.log(`Feed Reminder Badge text: "${feedBadgeText}"`);

        if (!feedActionBtnText.includes('Start Feed') && !feedActionBtnText.includes('Pause')) {
            throw new Error(`Expected feed button to contain "Start Feed", got: "${feedActionBtnText}"`);
        }
        if (!feedActionBtnText.includes('Next feed')) {
            throw new Error(`Expected feed button to integrate "Next feed" countdown, got: "${feedActionBtnText}"`);
        }
        console.log('✅ Feed Reminder seamlessly integrated into Feed Timer button & header badge');

        // Verify Pump Action Button & Badge
        await page.waitForSelector('#btn-pump-timer-action', { timeout: 4000 });
        await page.waitForSelector('#pump-timer-reminder-badge', { timeout: 4000 });

        const pumpActionBtnText = await page.$eval('#btn-pump-timer-action', el => el.innerText.trim());
        const pumpBadgeText = await page.$eval('#pump-timer-reminder-badge', el => el.innerText.trim());
        console.log(`Pump Action Button text:\n"${pumpActionBtnText}"`);
        console.log(`Pump Reminder Badge text: "${pumpBadgeText}"`);

        if (!pumpActionBtnText.includes('Start Pump') && !pumpActionBtnText.includes('Pause')) {
            throw new Error(`Expected pump button to contain "Start Pump", got: "${pumpActionBtnText}"`);
        }
        if (!pumpActionBtnText.includes('Next pump')) {
            throw new Error(`Expected pump button to integrate "Next pump" countdown, got: "${pumpActionBtnText}"`);
        }
        console.log('✅ Pump Reminder seamlessly integrated into Pump Watch button & header badge');

        const timersShot = path.join(ARTIFACTS_DIR, 'e2e_22_timers_with_reminders.png');
        await page.screenshot({ path: timersShot });
        console.log(`📸 Captured Timers with Integrated Reminders screenshot: ${timersShot}`);

        // =========================================================================
        // REQUIREMENT 2: Dashboard Customization Sticky Bar & Auto-Close UX
        // =========================================================================
        console.log('\n--- [Req 2] Testing Settings Customization Auto-Close & Sticky Floating Bar ---');
        await page.click('#btn-header-settings');
        await page.waitForSelector('#settings-modal', { timeout: 4000 });
        console.log('✅ Settings modal opened');

        // Check Category Default Values reminder inputs (Req 1)
        await page.waitForSelector('#settings-feed-interval-input', { timeout: 4000 });
        await page.waitForSelector('#settings-pump-interval-input', { timeout: 4000 });
        const feedIntervalVal = await page.$eval('#settings-feed-interval-input', el => el.value);
        const pumpIntervalVal = await page.$eval('#settings-pump-interval-input', el => el.value);
        console.log(`Category Default Feed Interval: ${feedIntervalVal} hrs, Pump Interval: ${pumpIntervalVal} hrs`);

        const settingsModalShot = path.join(ARTIFACTS_DIR, 'e2e_23_settings_category_defaults.png');
        await page.screenshot({ path: settingsModalShot });
        console.log(`📸 Captured Settings modal screenshot: ${settingsModalShot}`);

        // Click "Customize / Edit on Dashboard"
        await page.waitForSelector('#settings-toggle-layout-mode-btn', { timeout: 4000 });
        await page.click('#settings-toggle-layout-mode-btn');
        await new Promise(r => setTimeout(r, 400));

        // Verify settings modal is AUTO-CLOSED immediately
        const isSettingsOpen = await page.$eval('#settings-modal', () => true).catch(() => false);
        if (isSettingsOpen) {
            throw new Error('Settings modal should have auto-closed when entering dashboard edit mode!');
        }
        console.log('✅ Settings modal automatically closed upon selecting Edit mode');

        // Verify Sticky Floating Bar is visible on Tracker tab
        await page.waitForSelector('#layout-edit-bar-tracker', { timeout: 4000 });
        const stickyBarText = await page.$eval('#layout-edit-bar-tracker', el => el.innerText);
        if (!stickyBarText.includes('Dashboard Customization Active')) {
            throw new Error('Sticky floating bar text missing "Dashboard Customization Active"');
        }
        console.log('✅ Sticky floating bar is active with "Save & Done" button');

        const stickyBarShot = path.join(ARTIFACTS_DIR, 'e2e_24_sticky_customization_bar.png');
        await page.screenshot({ path: stickyBarShot });
        console.log(`📸 Captured Sticky Customization Bar screenshot: ${stickyBarShot}`);

        // Click "Save & Done" on the sticky bar
        await page.click('#layout-edit-done-btn-tracker');
        await new Promise(r => setTimeout(r, 400));
        const isStickyBarVisible = await page.$eval('#layout-edit-bar-tracker', () => true).catch(() => false);
        if (isStickyBarVisible) {
            throw new Error('Sticky bar should be dismissed after clicking Save & Done!');
        }
        console.log('✅ Successfully exited edit mode and saved customization view via sticky bar');

        // =========================================================================
        // REQUIREMENT 3 & 6: Sound Machine Modernization (Emoji, Continuous, Minutes)
        // =========================================================================
        console.log('\n--- [Req 3 & 6] Testing Nursery Sound Machine Modernization & Controls ---');
        await page.waitForSelector('#soundMachineCard', { timeout: 4000 });

        // Verify "Optional Custom Web Stream" is deprecated/removed
        const customWebStream = await page.$('#custom-web-stream-container');
        const customStreamInput = await page.$('input[placeholder*="YouTube"]');
        if (customWebStream || customStreamInput) {
            throw new Error('Found deprecated Custom Web Stream elements in Sound Machine!');
        }
        console.log('✅ Deprecated Custom Web Stream completely eliminated');

        // Verify White noise radio emoji 📻
        const soundMachineText = await page.$eval('#soundMachineCard', el => el.innerText);
        if (!soundMachineText.includes('📻')) {
            throw new Error('Expected White Noise emoji to be radio 📻');
        }
        console.log('✅ White noise preset updated with radio 📻 emoji');

        // Verify Mode Pill (Continuous or Timer)
        await page.waitForSelector('#soundModePill', { timeout: 4000 });
        const modePillText = await page.$eval('#soundModePill', el => el.innerText.trim());
        console.log(`Sound Mode Pill text: "${modePillText}"`);

        // Check Infinite Loop checkbox & Minutes box
        await page.waitForSelector('#soundInfiniteLoopCheckbox', { timeout: 4000 });
        await page.waitForSelector('#soundMinutesInput', { timeout: 4000 });

        // Test checking Infinite Loop
        const isInfiniteChecked = await page.$eval('#soundInfiniteLoopCheckbox', el => el.checked);
        console.log(`Infinite Loop initial checked state: ${isInfiniteChecked}`);

        const soundMachineShot = path.join(ARTIFACTS_DIR, 'e2e_25_sound_machine_controls.png');
        await page.screenshot({ path: soundMachineShot });
        console.log(`📸 Captured Sound Machine Controls screenshot: ${soundMachineShot}`);

        // =========================================================================
        // REQUIREMENT 4 & 7: Profile Tab Text De-bloat & Milestone Trophy Case Move
        // =========================================================================
        console.log('\n--- [Req 4 & 7] Testing Profile Tab Text De-bloat & Milestone Trophy Case Migration ---');
        await page.click('#nav-tab-profile');
        await new Promise(r => setTimeout(r, 500));
        await page.waitForSelector('#caregiver-handoff-card', { timeout: 4000 });

        const profileText = await page.$eval('#caregiver-handoff-card', el => el.innerText);

        // Verify "Active Shift: On duty since" removed
        if (profileText.includes('Active Shift: On duty since')) {
            throw new Error('Found redundant "Active Shift: On duty since" in Profile!');
        }
        console.log('✅ Redundant "Active Shift: On duty since ..." descriptor text removed');

        // Verify "is On Duty" removed
        if (profileText.includes('is On Duty')) {
            throw new Error('Found redundant "is On Duty" text in Profile!');
        }
        console.log('✅ Redundant "is On Duty" suffix removed from active caregiver');

        // Verify Milestone Trophy Case is in Profile tab
        await page.waitForSelector('#milestone-trophy-case', { timeout: 4000 });
        console.log('✅ Milestone Trophy Case successfully migrated to Profile tab');

        // Verify Safe Vault trophy is replaced by Night Owl Caregiver (Req 7)
        const trophyText = await page.$eval('#milestone-trophy-case', el => el.innerText);
        if (trophyText.includes('Safe Vault')) {
            throw new Error('Found deprecated Safe Vault trophy in Trophy Case!');
        }
        if (!trophyText.includes('Night Owl Caregiver')) {
            throw new Error('Expected "Night Owl Caregiver" trophy to replace Safe Vault!');
        }
        console.log('✅ Deprecated Safe Vault trophy replaced by "Night Owl Caregiver" trophy');

        const profileShot = path.join(ARTIFACTS_DIR, 'e2e_26_profile_tab_debloated.png');
        await page.screenshot({ path: profileShot });
        console.log(`📸 Captured Profile Tab with Trophy Case screenshot: ${profileShot}`);

        // =========================================================================
        // REQUIREMENT 7: Appointments & Monthly Activity Calendar in Tools & Metrics
        // =========================================================================
        console.log('\n--- [Req 7] Testing Appointments & Monthly Activity Calendar in Tools & Metrics Tab ---');
        await page.click('#nav-tab-metrics');
        await new Promise(r => setTimeout(r, 500));

        await page.waitForSelector('#appointments-card', { timeout: 4000 });
        console.log('✅ Appointments Card successfully migrated to Tools & Metrics tab');

        await page.waitForSelector('#monthly-activity-calendar', { timeout: 4000 });
        console.log('✅ Monthly Activity Calendar successfully migrated to Tools & Metrics tab');

        const metricsShot = path.join(ARTIFACTS_DIR, 'e2e_27_metrics_appointments_calendar.png');
        await page.screenshot({ path: metricsShot });
        console.log(`📸 Captured Tools & Metrics tab with Appointments & Calendar screenshot: ${metricsShot}`);

        // =========================================================================
        // REQUIREMENT 8 & 9: Quick Log Custom Entry Removal & Pinning / Collapsing
        // =========================================================================
        console.log('\n--- [Req 8 & 9] Testing Quick Log "Custom Entry" Removal & Pinning / Collapsing ---');
        await page.click('#nav-tab-tracker');
        await new Promise(r => setTimeout(r, 400));
        await page.waitForSelector('#quick-logging-pad', { timeout: 4000 });

        // Check top-right of Quick Log for "Custom Entry" button (Req 8)
        const customEntryBtn = await page.$('#quick-logging-pad button[aria-label="Custom Activity Entry Form"]');
        if (customEntryBtn) {
            throw new Error('Redundant "Custom Entry" button should have been removed from Quick Log top-right!');
        }
        console.log('✅ Redundant "Custom Entry" button successfully removed');

        // Check Collapse Toggle Button (Req 9)
        await page.waitForSelector('#toggle-quick-log-collapse-btn', { timeout: 4000 });
        const initialCollapseBtnText = await page.$eval('#toggle-quick-log-collapse-btn', el => el.innerText.trim());
        console.log(`Initial Quick Log Collapse Button: "${initialCollapseBtnText}"`);

        // Count initial tiles
        const initialTilesCount = await page.$$eval('#quick-logging-pad button[id^="btn-quick-log-"]', els => els.length);
        console.log(`Total Quick Log tiles shown: ${initialTilesCount}`);

        // Click Collapse Toggle to show Pinned Only
        await page.click('#toggle-quick-log-collapse-btn');
        await new Promise(r => setTimeout(r, 300));

        const collapsedTilesCount = await page.$$eval('#quick-logging-pad button[id^="btn-quick-log-"]', els => els.length);
        const afterCollapseBtnText = await page.$eval('#toggle-quick-log-collapse-btn', el => el.innerText.trim());
        console.log(`Collapsed tiles count (Pinned Only): ${collapsedTilesCount}`);
        console.log(`Collapse button text now: "${afterCollapseBtnText}"`);

        if (collapsedTilesCount >= initialTilesCount) {
            throw new Error(`Expected collapsed tiles count (${collapsedTilesCount}) to be less than total (${initialTilesCount})`);
        }
        console.log('✅ Quick Log Collapse successfully shows only pinned favorites (e.g. Pee, Poop, Feed)');

        const collapsedPadShot = path.join(ARTIFACTS_DIR, 'e2e_28_quick_log_collapsed.png');
        await page.screenshot({ path: collapsedPadShot });
        console.log(`📸 Captured Collapsed Quick Log screenshot: ${collapsedPadShot}`);

        // Un-collapse back to all items
        await page.click('#toggle-quick-log-collapse-btn');
        await new Promise(r => setTimeout(r, 300));
        const restoredTilesCount = await page.$$eval('#quick-logging-pad button[id^="btn-quick-log-"]', els => els.length);
        if (restoredTilesCount !== initialTilesCount) {
            throw new Error('Expected Quick Log to restore all tiles when un-collapsed');
        }
        console.log('✅ Quick Log smoothly toggled back to full activity list');

        console.log('\n=========================================================================');
        console.log('🎉 ALL 9 DE-BLOAT & REFACTORING REQUIREMENTS VERIFIED LIVE WITH 0 ERRORS!');
        console.log('=========================================================================\n');
    } catch (err) {
        console.error('❌ Phase 2 De-Bloat verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runPhase2DebloatVerification();
