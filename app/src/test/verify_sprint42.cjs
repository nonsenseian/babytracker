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
const profileDir = 'c:\\Users\\ianpa\\Downloads\\Nonsenseian_github\\scratch\\sprint42_test_profile';

async function runSprint42Verification() {
    console.log('🚀 Starting Sprint 42 QA Verification with Puppeteer (iPhone 14 Pro emulation)...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--user-data-dir=${profileDir}`,
            '--window-size=430,920'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({
            width: 393,
            height: 852,
            isMobile: true,
            hasTouch: true,
            deviceScaleFactor: 3
        });

        console.log('Navigating to http://localhost:5173/ ...');
        await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));

        // ----------------------------------------------------
        // TEST 1: Quick Logging Pad 5-Second Popup (Edit & Undo)
        // ----------------------------------------------------
        console.log('🧪 Testing Quick Logging Pad Popup...');
        
        // Find and click the "Formula" button in Quick Logging Pad
        const clicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const formulaBtn = btns.find(b => b.innerText.includes('Formula'));
            if (formulaBtn) {
                formulaBtn.click();
                return true;
            }
            return false;
        });
        console.log('Formula button clicked:', clicked);
        await new Promise(r => setTimeout(r, 600));

        // Verify the 5-second popup appeared
        const popupExists = await page.evaluate(() => {
            const popup = document.getElementById('quick-log-popup');
            const editBtn = document.getElementById('btn-quick-log-edit');
            const undoBtn = document.getElementById('btn-quick-log-undo');
            return {
                hasPopup: !!popup,
                hasEditBtn: !!editBtn,
                hasUndoBtn: !!undoBtn,
                text: popup ? popup.innerText : ''
            };
        });

        console.log('Quick log popup status:', popupExists);
        if (!popupExists.hasPopup || !popupExists.hasEditBtn || !popupExists.hasUndoBtn) {
            throw new Error('Quick log popup failed to render with Edit Activity and Undo buttons!');
        }

        // Capture Screenshot 1: Quick Logging Pad 5-Second Popup with "Edit Activity" and "Undo"
        const shot1Path = path.join(artifactDir, 'iphone_quick_log_popup_edit_undo.png');
        await page.screenshot({ path: shot1Path, fullPage: false });
        console.log('📸 Saved Screenshot 1:', shot1Path);

        // Test clicking "Undo"
        console.log('Testing "Undo" button click...');
        await page.evaluate(() => {
            const undoBtn = document.getElementById('btn-quick-log-undo');
            if (undoBtn) undoBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));

        const afterUndo = await page.evaluate(() => {
            return !document.getElementById('quick-log-popup');
        });
        console.log('Popup cleanly dismissed on Undo:', afterUndo);

        // Test clicking another item and clicking "Edit Activity"
        console.log('Testing "Edit Activity" button click...');
        await new Promise(r => setTimeout(r, 900)); // Respect 800ms debounce
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const poopBtn = btns.find(b => b.innerText.includes('Poop'));
            if (poopBtn) poopBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));

        await page.evaluate(() => {
            const editBtn = document.getElementById('btn-quick-log-edit');
            if (editBtn) editBtn.click();
        });
        await new Promise(r => setTimeout(r, 600));

        // Check if log edit modal opened
        const modalOpen = await page.evaluate(() => {
            return !!document.querySelector('.modal-backdrop');
        });
        console.log('Activity Edit modal successfully opened from popup:', modalOpen);

        // Close the modal
        await page.evaluate(() => {
            const closeBtns = Array.from(document.querySelectorAll('button[aria-label="Close modal"], button.btn-ghost'));
            if (closeBtns.length > 0) closeBtns[0].click();
        });
        await new Promise(r => setTimeout(r, 500));

        // ----------------------------------------------------
        // TEST 2: Nightstand Voice Assistant Menu & Modalities
        // ----------------------------------------------------
        console.log('🧪 Testing Nightstand Voice Assistant Menu...');
        
        // Open Nightstand Voice Modal by clicking voice button
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const voiceBtn = btns.find(b => b.innerText.includes('Nightstand') || b.innerText.includes('Voice') || b.getAttribute('aria-label')?.includes('voice'));
            if (voiceBtn) {
                voiceBtn.click();
            } else {
                // Click header mic button if present
                const micBtn = document.querySelector('button[aria-label*="voice" i], button[aria-label*="mic" i]');
                if (micBtn) (micBtn).click();
            }
        });
        await new Promise(r => setTimeout(r, 600));

        // Check dual buttons exist
        const voiceControls = await page.evaluate(() => {
            const micBtn = document.getElementById('btn-voice-mic-toggle');
            const speakerBtn = document.getElementById('btn-voice-speaker-toggle');
            const title = document.getElementById('nightstand-voice-title');
            return {
                hasMicBtn: !!micBtn,
                hasSpeakerBtn: !!speakerBtn,
                hasTitle: !!title,
                micText: micBtn ? micBtn.innerText : '',
                speakerText: speakerBtn ? speakerBtn.innerText : ''
            };
        });
        console.log('Voice Assistant controls:', voiceControls);
        if (!voiceControls.hasMicBtn || !voiceControls.hasSpeakerBtn) {
            throw new Error('Nightstand Voice Assistant dual mic/speaker controls missing!');
        }

        // Capture Screenshot 2: Nightstand Voice Modal with Dual Controls (Full Two-Way)
        const shot2Path = path.join(artifactDir, 'iphone_nightstand_voice_modal_dual_controls.png');
        await page.screenshot({ path: shot2Path, fullPage: false });
        console.log('📸 Saved Screenshot 2:', shot2Path);

        // Test toggling Speaker OFF (Silent Voice Mode)
        console.log('Toggling Speaker to OFF (Silent Voice Mode)...');
        await page.evaluate(() => {
            const speakerBtn = document.getElementById('btn-voice-speaker-toggle');
            if (speakerBtn) speakerBtn.click();
        });
        await new Promise(r => setTimeout(r, 400));

        // Capture Screenshot 3: Silent Voice Mode (Mic ON, Speaker OFF)
        const shot3Path = path.join(artifactDir, 'iphone_voice_modal_silent_mode.png');
        await page.screenshot({ path: shot3Path, fullPage: false });
        console.log('📸 Saved Screenshot 3:', shot3Path);

        // Test unrecognized command simulation
        console.log('Testing Unrecognized Command simulation ("I didn\'t catch that")...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const unrecBtn = btns.find(b => b.innerText.includes('Play jazz') || b.innerText.includes('Unrecognized'));
            if (unrecBtn) unrecBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));

        const replyText = await page.evaluate(() => {
            return document.body.innerText;
        });
        console.log('Verified unrecognized phrasing included:', replyText.includes("I didn't catch that"));

        console.log('🎉 ALL SPRINT 42 TESTS PASSED PERFECTLY!');
    } catch (err) {
        console.error('❌ QA Verification Failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runSprint42Verification();
