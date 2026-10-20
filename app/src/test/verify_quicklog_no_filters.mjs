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

async function verifyQuickLogNoFilters() {
    console.log('🚀 Verifying that filters have been removed from Quick Log box...');
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

        // Verify no category filter pill buttons exist in #quick-logging-pad
        const filterPillTexts = await page.$$eval('#quick-logging-pad button', buttons => 
            buttons.map(b => b.innerText.trim()).filter(text => 
                ['All Items', '🍼 Feeds', '💧 Diapers', '😴 Sleep', '⭐ Care & Vitals'].some(f => text.includes(f))
            )
        );

        console.log('Found filter pill matches:', filterPillTexts);
        if (filterPillTexts.length > 0) {
            throw new Error(`Filters found in Quick log box: ${JSON.stringify(filterPillTexts)}`);
        }
        console.log('✅ Confirmed: 0 filter pill buttons found in Quick Log box');

        // Verify quick log buttons are present
        const quickTiles = await page.$$eval('#quick-logging-pad button[id^="btn-quick-log-"]', btns => btns.length);
        console.log(`Total quick log buttons rendered: ${quickTiles}`);
        if (quickTiles < 10) {
            throw new Error(`Expected at least 10 quick log buttons, found: ${quickTiles}`);
        }
        console.log('✅ Confirmed: All quick log buttons render directly without category filtering');

        // Capture screenshot of #quick-logging-pad
        const quickLogElement = await page.$('#quick-logging-pad');
        const shotPath = path.join(ARTIFACTS_DIR, 'quick_log_box_no_filters.png');
        if (quickLogElement) {
            await quickLogElement.screenshot({ path: shotPath });
            console.log(`📸 Captured screenshot of Quick Log box: ${shotPath}`);
        }

        console.log('🎉 Verification passed successfully!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

verifyQuickLogNoFilters();
