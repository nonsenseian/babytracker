const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = chromePaths.find(p => fs.existsSync(p));
if (!executablePath) {
    console.error('No local Edge or Chrome executable found.');
    process.exit(1);
}

const artifactDir = 'C:\\Users\\ianpa\\.gemini\\antigravity-ide\\brain\\d4933be6-6d18-4c7a-ab3e-755d23239215';
const profileDir = 'c:\\Users\\ianpa\\Downloads\\Nonsenseian_github\\scratch\\clean_edge_test_profile';

async function runVerification() {
    console.log('Launching browser via executable:', executablePath);
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--user-data-dir=${profileDir}`,
            '--window-size=1280,1050'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1050 });
        console.log('Navigating to http://localhost:5173/ ...');
        await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });

        console.log('Waiting for main elements...');
        await page.waitForSelector('#monthly-activity-calendar', { timeout: 10000 });

        // Log a quick activity through the UI to generate a real log for today (2026-10-14)
        console.log('Logging an activity via Quick Logging Pad...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const formulaBtn = btns.find(b => b.innerText.includes('Formula'));
            if (formulaBtn) formulaBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));

        // Scroll to calendar and date cycler
        await page.evaluate(() => {
            const el = document.getElementById('monthly-activity-calendar');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        });
        await new Promise(r => setTimeout(r, 200));

        // Screenshot 1: Default view showing Calendar with "Hide Calendar" button, and Date Cycler bar in Activity list
        const shot1Path = path.join(artifactDir, 'preview_date_cycler.png');
        await page.screenshot({ path: shot1Path });
        console.log(`Saved screenshot 1 to: ${shot1Path}`);

        // Check Hide Calendar button exists
        const hideBtn = await page.$('button[title="Hide monthly calendar"]');
        if (!hideBtn) {
            throw new Error('Hide monthly calendar button not found!');
        }
        console.log('Clicking "Hide Calendar" button...');
        await hideBtn.click();
        await new Promise(r => setTimeout(r, 400));

        // Screenshot 2: Calendar is collapsed/hidden
        const shot2Path = path.join(artifactDir, 'preview_calendar_hidden.png');
        await page.screenshot({ path: shot2Path });
        console.log(`Saved screenshot 2 to: ${shot2Path}`);

        // Verify the collapsed bar text
        const hiddenText = await page.evaluate(() => {
            const el = document.getElementById('monthly-activity-calendar');
            return el ? el.innerText : '';
        });
        console.log('Collapsed calendar content:', hiddenText);
        if (!hiddenText.includes('Show Calendar')) {
            throw new Error('Collapsed calendar does not show "Show Calendar" button!');
        }

        // Test Date Cycling: Click previous day button (<)
        console.log('Testing date cycling: Clicking previous day (<)...');
        const prevDayBtn = await page.$('button[aria-label="Previous day"]');
        if (!prevDayBtn) {
            throw new Error('Previous day button not found!');
        }
        await prevDayBtn.click();
        await new Promise(r => setTimeout(r, 400));

        // Test clicking/tabbing date to bring up calendar
        console.log('Testing bringing up calendar by clicking the date trigger...');
        const dateTriggerBtn = await page.$('button[title*="open Calendar view"]');
        if (!dateTriggerBtn) {
            throw new Error('Date trigger button not found!');
        }
        await dateTriggerBtn.click();
        await new Promise(r => setTimeout(r, 600));

        // Screenshot 3: Calendar brought up into view
        const shot3Path = path.join(artifactDir, 'preview_calendar_brought_up.png');
        await page.screenshot({ path: shot3Path });
        console.log(`Saved screenshot 3 to: ${shot3Path}`);

        // Additional Test: Clear filter to show all activities and verify stream date header
        console.log('Clearing day filter to display activity stream with date group headers...');
        const clearFilterBtn = await page.$('button[title*="Show all activity dates"]');
        if (clearFilterBtn) {
            await clearFilterBtn.click();
            await new Promise(r => setTimeout(r, 400));
        }

        // Scroll to activity log stream
        await page.evaluate(() => {
            const input = document.querySelector('input[placeholder*="Search logs"]');
            if (input) input.scrollIntoView({ behavior: 'instant', block: 'start' });
        });
        await new Promise(r => setTimeout(r, 300));

        const shot4Path = path.join(artifactDir, 'preview_log_stream_date_header.png');
        await page.screenshot({ path: shot4Path });
        console.log(`Saved screenshot 4 to: ${shot4Path}`);

        // Verify calendar is now expanded again
        const expandedText = await page.evaluate(() => {
            const el = document.getElementById('monthly-activity-calendar');
            return el ? el.innerText : '';
        });
        if (!expandedText.includes('Monthly Activity Calendar') || expandedText.includes('(Hidden)')) {
            throw new Error('Calendar was not expanded upon clicking/tabbing the date!');
        }

        console.log('SUCCESS! All 3 requirements verified end-to-end in real browser.');
    } finally {
        await browser.close();
    }
}

runVerification().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
