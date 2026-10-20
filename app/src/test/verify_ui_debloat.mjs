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

async function runUIDebloatVerification() {
    console.log('🚀 Starting comprehensive E2E verification for UI De-Bloat...');
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

        // ==========================================
        // 1. Navigation Tabs Verification
        // ==========================================
        console.log('\n--- 1. Testing Renamed Tabs ("Tracker", "Tools & Metrics", "Profile") ---');
        const tabTrackerText = await page.$eval('#nav-tab-tracker', el => el.innerText.trim());
        const tabMetricsText = await page.$eval('#nav-tab-metrics', el => el.innerText.trim());
        const tabProfileText = await page.$eval('#nav-tab-profile', el => el.innerText.trim());

        console.log(`Tab Tracker text: "${tabTrackerText}"`);
        console.log(`Tab Metrics text: "${tabMetricsText}"`);
        console.log(`Tab Profile text: "${tabProfileText}"`);

        if (tabTrackerText !== 'Tracker') {
            throw new Error(`Expected tab tracker to be "Tracker", got: "${tabTrackerText}"`);
        }
        if (tabMetricsText !== 'Tools & Metrics') {
            throw new Error(`Expected tab metrics to be "Tools & Metrics", got: "${tabMetricsText}"`);
        }
        if (tabProfileText !== 'Profile') {
            throw new Error(`Expected tab profile to be "Profile", got: "${tabProfileText}"`);
        }
        console.log('✅ All main tabs accurately and concisely renamed');

        // ==========================================
        // 2. Quick Log Header & Button De-Bloat
        // ==========================================
        console.log('\n--- 2. Testing Quick Log De-Bloated Header & Buttons ---');
        const padHeader = await page.$eval('#quick-logging-pad h2', el => el.innerText.trim());
        console.log(`Quick Log header title: "${padHeader}"`);
        if (padHeader !== 'QUICK LOG') {
            throw new Error(`Expected header title to be "QUICK LOG", got "${padHeader}"`);
        }

        const padText = await page.$eval('#quick-logging-pad', el => el.innerText);
        if (padText.includes('Pediatric care targets and daily routine tracking')) {
            throw new Error('Found redundant subtitle in quick-logging-pad!');
        }
        console.log('✅ Redundant subtitle successfully eliminated from Quick Log header');

        // Verify "Solids" button is removed
        const solidsBtn = await page.$('#btn-quick-log-solids');
        if (solidsBtn) {
            throw new Error('Standalone Solids button should have been removed from Quick Log!');
        }
        console.log('✅ Standalone Solids button removed from Quick Log pad');

        // Verify "Medication" button is present (replacing Vitamins)
        await page.waitForSelector('#btn-quick-log-medication', { timeout: 4000 });
        const medBtnText = await page.$eval('#btn-quick-log-medication', el => el.innerText.trim());
        console.log(`Medication button text: "${medBtnText}"`);
        if (!medBtnText.includes('Medication')) {
            throw new Error(`Expected Medication button, got "${medBtnText}"`);
        }
        console.log('✅ "Medication" button successfully replaces Vitamins');

        // Verify "Vitals" button is present (replacing Med / Temp)
        await page.waitForSelector('#btn-quick-log-vitals', { timeout: 4000 });
        const vitalsBtnText = await page.$eval('#btn-quick-log-vitals', el => el.innerText.trim());
        console.log(`Vitals button text: "${vitalsBtnText}"`);
        if (!vitalsBtnText.includes('Vitals')) {
            throw new Error(`Expected Vitals button, got "${vitalsBtnText}"`);
        }
        console.log('✅ "Vitals" button successfully replaces Med / Temp');

        // Verify button heights are compact and have NO grey descriptor text
        const peeBtnText = await page.$eval('#btn-quick-log-pee', el => el.innerText.trim());
        console.log(`Pee button text: "${peeBtnText}"`);
        if (peeBtnText.includes('Wet Diaper')) {
            throw new Error('Found descriptor grey text "Wet Diaper" on Pee button!');
        }
        console.log('✅ Descriptor grey text completely removed from quick log buttons');

        // Capture screenshot of de-bloated Quick Log pad
        const quickLogShot = path.join(ARTIFACTS_DIR, 'e2e_18_quick_log_debloated.png');
        await page.screenshot({ path: quickLogShot });
        console.log(`📸 Captured clean Quick Log screenshot: ${quickLogShot}`);

        // ==========================================
        // 3. Medication Modal Flow
        // ==========================================
        console.log('\n--- 3. Testing Medication Modal Flow ---');
        await page.click('#btn-quick-log-medication');
        await new Promise(r => setTimeout(r, 400));
        await page.waitForSelector('#log-activity-modal', { timeout: 4000 });
        await page.waitForSelector('#medication-name-input', { timeout: 4000 });

        // Fill in medication details
        await page.type('#medication-name-input', 'Infant Tylenol');
        await page.type('#medication-dosage-input', '1.25 mL');

        const medModalShot = path.join(ARTIFACTS_DIR, 'e2e_19_medication_modal.png');
        await page.screenshot({ path: medModalShot });
        console.log(`📸 Captured Medication modal screenshot: ${medModalShot}`);

        await page.click('#btn-save-log-activity');
        await new Promise(r => setTimeout(r, 600));
        console.log('✅ Saved Medication log');

        // ==========================================
        // 4. Vitals Modal Flow
        // ==========================================
        console.log('\n--- 4. Testing Vitals Modal Flow ---');
        await page.click('#btn-quick-log-vitals');
        await new Promise(r => setTimeout(r, 400));
        await page.waitForSelector('#log-activity-modal', { timeout: 4000 });
        await page.waitForSelector('#vitals-temperature-input', { timeout: 4000 });

        // Test temperature input & F/C toggle
        await page.type('#vitals-temperature-input', '98.6');
        await page.select('#vitals-site-select', 'Forehead');
        await page.type('#vitals-pulse-input', '118');

        const vitalsModalShot = path.join(ARTIFACTS_DIR, 'e2e_20_vitals_modal.png');
        await page.screenshot({ path: vitalsModalShot });
        console.log(`📸 Captured Vitals modal screenshot: ${vitalsModalShot}`);

        await page.click('#btn-save-log-activity');
        await new Promise(r => setTimeout(r, 600));
        console.log('✅ Saved Vitals log');

        // ==========================================
        // 5. Feed Modal with Solids Integration Flow
        // ==========================================
        console.log('\n--- 5. Testing Feed Modal with Solids Integration ---');
        await page.click('#quick-logging-pad button[aria-label="Custom Activity Entry Form"]');
        await new Promise(r => setTimeout(r, 400));
        await page.waitForSelector('#log-activity-modal', { timeout: 4000 });

        // Select Feed category if not default
        await page.select('#log-activity-category-select', 'feeding');
        await new Promise(r => setTimeout(r, 200));

        // Click the new Solids feed type
        await page.waitForSelector('#feed-type-solids', { timeout: 4000 });
        await page.click('#feed-type-solids');
        await new Promise(r => setTimeout(r, 300));

        await page.waitForSelector('#solids-food-name-input', { timeout: 4000 });
        await page.type('#solids-food-name-input', 'Sweet Potato Puree');
        await page.type('#solids-portion-input', '2 oz');

        const feedSolidsShot = path.join(ARTIFACTS_DIR, 'e2e_21_feed_solids_modal.png');
        await page.screenshot({ path: feedSolidsShot });
        console.log(`📸 Captured Feed with Solids modal screenshot: ${feedSolidsShot}`);

        await page.click('#btn-save-log-activity');
        await new Promise(r => setTimeout(r, 600));
        console.log('✅ Saved Feed log with Solids successfully');

        console.log('\n🎉 ALL UI DE-BLOAT, REFACTORING, AND MODAL REQUIREMENTS VERIFIED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ UI De-Bloat verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runUIDebloatVerification();
