import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/ianpa/.gemini/antigravity-ide/brain/d4933be6-6d18-4c7a-ab3e-755d23239215';

const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = chromePaths.find(p => fs.existsSync(p));

async function run() {
    console.log('🚀 Testing routing from Activity Log Date to Monthly Calendar on Family Profile...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('#nav-tab-tracker', { timeout: 10000 });

        // Ensure we are on the tracker tab
        await page.click('#nav-tab-tracker');
        await new Promise(r => setTimeout(r, 400));

        // Click the date button in the activity log stream
        const dateBtn = await page.$('button[title*="open Calendar view"]');
        if (!dateBtn) {
            throw new Error('Date box button in activity log stream not found!');
        }

        console.log('Clicking "open Calendar view" in Activity Log...');
        await dateBtn.click();
        await new Promise(r => setTimeout(r, 600));

        // Verify that active tab is now profile
        const activeTabColor = await page.$eval('#nav-tab-profile', el => window.getComputedStyle(el).backgroundColor);
        console.log(`Profile tab background color: ${activeTabColor}`);

        // Verify that monthly-activity-calendar is present in the DOM
        const calendarEl = await page.$('#monthly-activity-calendar');
        if (!calendarEl) {
            throw new Error('Monthly activity calendar not found on page after click!');
        }

        // Verify calendar visibility
        const isVisible = await page.evaluate(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }, calendarEl);

        if (!isVisible) {
            throw new Error('Monthly activity calendar is not visible after routing!');
        }
        console.log('✅ Successfully routed to Monthly Calendar on Family Profile tab!');

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_11_calendar_routed_profile.png') });
        console.log('📸 Captured e2e_11_calendar_routed_profile.png');
        console.log('🎉 Verification PASSED!');
    } catch (e) {
        console.error('❌ Test failed:', e);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

run();
