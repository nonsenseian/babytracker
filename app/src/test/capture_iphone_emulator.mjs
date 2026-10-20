import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/ianpa/.gemini/antigravity-ide/brain/c95f67d7-3217-4d94-9b6e-c2b41d449ad5';

const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = chromePaths.find(p => fs.existsSync(p));

async function captureIPhoneScreenshots() {
    console.log('📱 Launching Puppeteer with iPhone 15 Pro configuration...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Exact iPhone 15/16 Pro dimensions: 393 x 852, DPR: 3
    await page.setViewport({
        width: 393,
        height: 852,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });

    await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    );

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('#condensed-floating-header', { timeout: 10000 });

        // 1. Capture initial iPhone view (Top of page, Timers & Quick Log)
        const shot1Path = path.join(ARTIFACTS_DIR, 'iphone_view_top.png');
        await page.screenshot({ path: shot1Path, fullPage: false });
        console.log(`📸 Saved iPhone view (top): ${shot1Path}`);

        // 2. Open notifications flyout and capture iPhone view
        const notifBtn = await page.$('#btn-header-notifications');
        if (notifBtn) {
            await notifBtn.click();
            await new Promise(r => setTimeout(r, 300));
            const shot2Path = path.join(ARTIFACTS_DIR, 'iphone_view_notifications.png');
            await page.screenshot({ path: shot2Path, fullPage: false });
            console.log(`📸 Saved iPhone view (notifications): ${shot2Path}`);
            // close it
            await page.click('body');
            await new Promise(r => setTimeout(r, 200));
        }

        // 3. Scroll down to show bottom persistent menu shrinking and activity sections
        await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'instant' }));
        await new Promise(r => setTimeout(r, 350));
        const shot3Path = path.join(ARTIFACTS_DIR, 'iphone_view_scrolled.png');
        await page.screenshot({ path: shot3Path, fullPage: false });
        console.log(`📸 Saved iPhone view (scrolled with shrunk persistent pill): ${shot3Path}`);

        console.log('✅ iPhone emulation captures completed successfully!');
    } catch (err) {
        console.error('Error during capture:', err);
    } finally {
        await browser.close();
    }
}

captureIPhoneScreenshots();
