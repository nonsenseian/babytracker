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

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1000']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1000 });
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

        console.log('Page loaded at http://localhost:5173/');

        // 1. Locate the Feed Timer discard milk element
        const discardEl = await page.$('#feed-discard-milk-countdown');
        console.log('Discard Milk timer element exists:', !!discardEl);
        if (!discardEl) throw new Error('Missing #feed-discard-milk-countdown element in Feed Timer card!');

        const initialText = await page.$eval('#feed-discard-milk-countdown', el => el.innerText.trim());
        console.log('Initial Discard Milk text:', initialText);
        if (!initialText.includes('Discard Milk in 60:00')) {
            throw new Error(`Expected initial text to be "Discard Milk in 60:00", got "${initialText}"`);
        }

        // 2. Start the feed timer
        console.log('Clicking Start on Feed Timer...');
        const startBtn = await page.evaluateHandle(() => {
            const card = document.querySelector('#feed-discard-milk-countdown').closest('.surface-elevated');
            const btns = card.querySelectorAll('button');
            for (const b of btns) {
                if (b.innerText.includes('Start')) return b;
            }
            return null;
        });
        if (!startBtn) throw new Error('Could not find Start button in Feed Timer card!');
        await startBtn.click();

        // 3. Wait 3 seconds to let it tick
        await new Promise(r => setTimeout(r, 3200));

        const runningText = await page.$eval('#feed-discard-milk-countdown', el => el.innerText.trim());
        console.log('Running Discard Milk text (after ~3s):', runningText);
        if (!runningText.includes('Discard Milk in 59:')) {
            throw new Error(`Expected running text to be in "59:XX" range, got "${runningText}"`);
        }

        // 4. Pause the timer
        console.log('Pausing Feed Timer...');
        const pauseBtn = await page.evaluateHandle(() => {
            const card = document.querySelector('#feed-discard-milk-countdown').closest('.surface-elevated');
            const btns = card.querySelectorAll('button');
            for (const b of btns) {
                if (b.innerText.includes('Pause')) return b;
            }
            return null;
        });
        if (pauseBtn) {
            await pauseBtn.click();
            await new Promise(r => setTimeout(r, 500));
        }

        // 5. Scroll and capture a zoomed screenshot of the Feed Timer card
        const cardHandle = await page.evaluateHandle(() => {
            return document.querySelector('#feed-discard-milk-countdown').closest('.surface-elevated');
        });

        const artifactDir = 'C:\\Users\\ianpa\\.gemini\\antigravity-ide\\brain\\d4933be6-6d18-4c7a-ab3e-755d23239215';
        const cardScreenshotPath = path.join(artifactDir, 'discard_milk_card_view.png');
        await cardHandle.asElement().screenshot({ path: cardScreenshotPath });
        console.log('Saved card screenshot:', cardScreenshotPath);

        // 6. Capture full dashboard screenshot
        const fullScreenshotPath = path.join(artifactDir, 'discard_milk_countdown_verified.png');
        await page.screenshot({ path: fullScreenshotPath });
        console.log('Saved full view screenshot:', fullScreenshotPath);

        // 7. Click Reset to test reset functionality
        console.log('Testing Reset button...');
        const resetBtn = await page.$('button[aria-label="Reset Feed Timer"]');
        if (!resetBtn) throw new Error('Missing Reset Feed Timer button!');
        await resetBtn.click();
        await new Promise(r => setTimeout(r, 500));

        const resetText = await page.$eval('#feed-discard-milk-countdown', el => el.innerText.trim());
        console.log('Discard text after Reset:', resetText);
        if (!resetText.includes('Discard Milk in 60:00')) {
            throw new Error(`Expected text after reset to be "Discard Milk in 60:00", got "${resetText}"`);
        }

        // 8. Test in Forest Sage theme (matching user's screenshot)
        console.log('Switching to forest-sage theme...');
        await page.evaluate(() => {
            const select = document.querySelector('select[value], select');
            // Try updating localStorage theme
            localStorage.setItem('bt_app_theme', 'forest-sage');
            document.documentElement.setAttribute('data-theme', 'forest-sage');
        });
        await page.reload({ waitUntil: 'networkidle0' });

        // Start timer and wait 8 seconds
        console.log('Running timer for 8 seconds in Forest Sage theme...');
        const forestStartBtn = await page.evaluateHandle(() => {
            const card = document.querySelector('#feed-discard-milk-countdown').closest('.surface-elevated');
            const btns = card.querySelectorAll('button');
            for (const b of btns) {
                if (b.innerText.includes('Start')) return b;
            }
            return null;
        });
        if (forestStartBtn) await forestStartBtn.click();
        await new Promise(r => setTimeout(r, 8200));

        // Pause timer
        const forestPauseBtn = await page.evaluateHandle(() => {
            const card = document.querySelector('#feed-discard-milk-countdown').closest('.surface-elevated');
            const btns = card.querySelectorAll('button');
            for (const b of btns) {
                if (b.innerText.includes('Pause')) return b;
            }
            return null;
        });
        if (forestPauseBtn) await forestPauseBtn.click();
        await new Promise(r => setTimeout(r, 400));

        // Capture Forest Sage card view
        const forestCardHandle = await page.evaluateHandle(() => {
            return document.querySelector('#feed-discard-milk-countdown').closest('.surface-elevated');
        });
        const forestCardScreenshotPath = path.join(artifactDir, 'discard_milk_forest_theme_card.png');
        await forestCardHandle.asElement().screenshot({ path: forestCardScreenshotPath });
        console.log('Saved forest sage theme screenshot:', forestCardScreenshotPath);

        console.log('All Discard Milk timer verifications passed successfully!');
    } catch (err) {
        console.error('Verification failed:', err);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
    }
})();
