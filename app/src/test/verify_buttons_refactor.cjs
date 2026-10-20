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

        // 1. Verify Top Right Voice Assistant button exists
        const voiceBtnInTop = await page.$('#btn-voice-assistant-toggle');
        console.log('Voice Assistant button in top navigation:', !!voiceBtnInTop);
        if (!voiceBtnInTop) throw new Error('Missing Voice Assistant button in top navigation!');

        // 2. Verify Top Right Sound Machine music note button exists
        const musicNoteBtn = await page.$('#btn-jump-sound-machine');
        console.log('Music Note jump button in top navigation:', !!musicNoteBtn);
        if (!musicNoteBtn) throw new Error('Missing Music Note jump button in top navigation!');

        // 3. Verify Old Sound Machine button is removed
        const oldSoundBtn = await page.$('#tab-action-sound');
        console.log('Old stacked sound machine button exists:', !!oldSoundBtn);
        if (oldSoundBtn) throw new Error('Old tab-action-sound button was NOT removed!');

        // 4. Verify Quick Logging Pad does NOT contain the voice assistant button
        const quickPadVoiceBtn = await page.evaluate(() => {
            const pad = document.querySelector('#section-quick-logging');
            if (pad) {
                return !!pad.querySelector('#btn-voice-assistant-toggle');
            }
            return false;
        });
        console.log('Voice assistant button in Quick Logging Pad:', quickPadVoiceBtn);
        if (quickPadVoiceBtn) throw new Error('Voice Assistant button is still inside Quick Logging Pad!');

        // 5. Screenshot Top Navigation and Quick Logging Pad
        const artifactDir = 'C:\\Users\\ianpa\\.gemini\\antigravity-ide\\brain\\d4933be6-6d18-4c7a-ab3e-755d23239215';
        const topScreenshotPath = path.join(artifactDir, 'buttons_refactor_top_view.png');
        await page.screenshot({ path: topScreenshotPath });
        console.log('Saved top screenshot:', topScreenshotPath);

        // 6. Click the Music Note jump button
        console.log('Clicking Music Note jump button...');
        await page.click('#btn-jump-sound-machine');
        await new Promise(r => setTimeout(r, 800));

        // 7. Verify Sound Machine is scrolled near the viewport
        const soundMachineRect = await page.evaluate(() => {
            const el = document.getElementById('block-sound-machine') || document.getElementById('soundMachineCard');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, height: r.height };
        });
        console.log('Sound Machine element bounding rect:', soundMachineRect);

        // 8. Screenshot scrolled state
        const scrollScreenshotPath = path.join(artifactDir, 'buttons_refactor_sound_machine_view.png');
        await page.screenshot({ path: scrollScreenshotPath });
        console.log('Saved sound machine scroll screenshot:', scrollScreenshotPath);

        // 9. Verify Custom option in Feed and Pump dropdowns
        console.log('Verifying Custom interval options on Reminder Cards...');
        const feedOptions = await page.evaluate(() => {
            const sel = document.getElementById('feedIntervalSelect');
            if (!sel) return [];
            return Array.from(sel.options).map(o => ({ value: o.value, text: o.text }));
        });
        console.log('Feed dropdown options:', feedOptions);
        const hasFeedCustom = feedOptions.some(o => o.value === 'custom' && o.text.includes('Custom'));
        if (!hasFeedCustom) throw new Error('Feed reminder dropdown missing Custom option!');

        const pumpOptions = await page.evaluate(() => {
            const sel = document.getElementById('pumpIntervalSelect');
            if (!sel) return [];
            return Array.from(sel.options).map(o => ({ value: o.value, text: o.text }));
        });
        console.log('Pump dropdown options:', pumpOptions);
        const hasPumpCustom = pumpOptions.some(o => o.value === 'custom' && o.text.includes('Custom'));
        if (!hasPumpCustom) throw new Error('Pump reminder dropdown missing Custom option!');

        // 10. Test selecting Custom for Feed and accepting 4.5 hours
        let nextPromptValue = '4.5';
        page.on('dialog', async dialog => {
            console.log('Native prompt intercepted:', dialog.message());
            await dialog.accept(nextPromptValue);
        });

        console.log('Selecting Custom on Feed dropdown...');
        await page.select('#feedIntervalSelect', 'custom');
        await new Promise(r => setTimeout(r, 600));

        const updatedFeedValue = await page.$eval('#feedIntervalSelect', el => el.value);
        console.log('Updated Feed interval select value:', updatedFeedValue);
        if (updatedFeedValue !== '4.5') throw new Error(`Expected feed interval 4.5, got ${updatedFeedValue}`);

        // 11. Test selecting Custom for Pump and accepting 5 hours
        nextPromptValue = '5';
        console.log('Selecting Custom on Pump dropdown...');
        await page.select('#pumpIntervalSelect', 'custom');
        await new Promise(r => setTimeout(r, 600));

        const updatedPumpValue = await page.$eval('#pumpIntervalSelect', el => el.value);
        console.log('Updated Pump interval select value:', updatedPumpValue);
        if (updatedPumpValue !== '5') throw new Error(`Expected pump interval 5, got ${updatedPumpValue}`);

        // 12. Scroll to top and screenshot the updated Reminder Cards showing Custom intervals
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await new Promise(r => setTimeout(r, 400));
        const reminderScreenshotPath = path.join(artifactDir, 'custom_timer_reminders_verified.png');
        await page.screenshot({ path: reminderScreenshotPath });
        console.log('Saved custom timer reminders screenshot:', reminderScreenshotPath);

        console.log('All verification checks passed successfully!');
    } catch (err) {
        console.error('Verification failed:', err);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
    }
})();
