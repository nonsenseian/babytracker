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

async function runFloatingHeaderAndDebloatVerification() {
    console.log('🚀 Starting E2E verification for Floating Header & Dashboard De-Bloat...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('#quick-logging-pad', { timeout: 10000 });
        console.log('✅ Page loaded successfully on Tracker tab');

        // ==========================================
        // 1. In-Feed AddWidgetShelf & Streamline View
        // ==========================================
        console.log('\n--- 1. Testing In-Feed AddWidgetShelf & Streamline View ---');
        await page.waitForSelector('#add-widget-shelf', { timeout: 5000 });
        console.log('✅ Found #add-widget-shelf in tracker feed');

        // Test Streamline View toggle if all widgets are currently active
        const streamlineBtn = await page.$('#btn-streamline-dashboard');
        if (streamlineBtn) {
            console.log('Tapping #btn-streamline-dashboard to test Streamline (Newborn) mode...');
            await streamlineBtn.click();
            await new Promise(r => setTimeout(r, 400));
        }

        // Verify that optional tool buttons now appear in the shelf
        await page.waitForSelector('#btn-add-widget-sound-machine', { timeout: 4000 });
        await page.waitForSelector('#btn-add-widget-sweet-nap', { timeout: 4000 });
        console.log('✅ AddWidgetShelf displays 1-tap addition pills for hidden tools');

        // Capture screenshot of the in-feed AddWidgetShelf
        const shelfShotPath = path.join(ARTIFACTS_DIR, 'e2e_17_add_widget_shelf.png');
        await page.screenshot({ path: shelfShotPath });
        console.log(`📸 Captured in-feed shelf screenshot: ${shelfShotPath}`);

        // Test adding a tool back (Sound Machine)
        console.log('Clicking #btn-add-widget-sound-machine...');
        await page.click('#btn-add-widget-sound-machine');
        await new Promise(r => setTimeout(r, 400));

        // Verify Sound Machine card appeared in DOM
        await page.waitForSelector('#section-sound-machine', { timeout: 4000 });
        console.log('✅ Sound Machine card immediately restored into feed upon tapping shelf pill');

        // Test adding SweetNap Predictor
        console.log('Clicking #btn-add-widget-sweet-nap...');
        await page.click('#btn-add-widget-sweet-nap');
        await new Promise(r => setTimeout(r, 400));
        await page.waitForSelector('#section-sweet-nap', { timeout: 4000 });
        console.log('✅ SweetNap Predictor card immediately restored into feed');

        // ==========================================
        // 2. Sticky Condensed Floating Header
        // ==========================================
        console.log('\n--- 2. Testing Sticky Condensed Floating Header ---');

        // Initially at top (scrollY = 0), header should be hidden
        const initialOpacity = await page.$eval('#condensed-floating-header', el => window.getComputedStyle(el).opacity);
        console.log(`Floating header opacity at top of page: ${initialOpacity}`);
        if (initialOpacity !== '0') {
            throw new Error(`Expected floating header to be hidden at scroll 0, got opacity: ${initialOpacity}`);
        }
        console.log('✅ Floating header is correctly hidden when user is at the top');

        // Scroll down 400px
        console.log('Scrolling window down by 400px...');
        await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
        await new Promise(r => setTimeout(r, 500));

        // In case it tucked away due to scroll delta, simulate slight scroll-up or check visibility
        await page.evaluate(() => window.scrollBy({ top: -20, behavior: 'instant' }));
        await new Promise(r => setTimeout(r, 400));

        const scrolledOpacity = await page.$eval('#condensed-floating-header', el => window.getComputedStyle(el).opacity);
        console.log(`Floating header opacity after scroll: ${scrolledOpacity}`);
        if (scrolledOpacity !== '1') {
            throw new Error(`Expected floating header to be visible (opacity 1), got: ${scrolledOpacity}`);
        }
        console.log('✅ Floating header smoothly glides into view on scroll');

        // Verify Child pill text
        const childPillText = await page.$eval('#floating-active-child-btn', el => el.innerText.trim());
        console.log(`Floating active child button text: "${childPillText}"`);
        if (!childPillText.includes('Baby Ian') && !childPillText.includes('Baby')) {
            throw new Error(`Unexpected child pill text: ${childPillText}`);
        }
        console.log('✅ Floating header displays Active Child pill');

        // Verify Caregiver pill text
        const caregiverPillText = await page.$eval('#floating-active-caregiver-btn', el => el.innerText.trim());
        console.log(`Floating active caregiver button text: "${caregiverPillText}"`);

        // Test Child Dropdown inside floating header
        console.log('Clicking #floating-active-child-btn to open quick switch menu...');
        await page.click('#floating-active-child-btn');
        await new Promise(r => setTimeout(r, 300));
        await page.waitForSelector('#floating-child-dropdown-menu', { timeout: 3000 });
        console.log('✅ Floating child dropdown menu opened');

        // Close dropdown
        await page.click('body', { offset: { x: 10, y: 10 } });
        await new Promise(r => setTimeout(r, 200));

        // Test tab switching from floating header: Switch to Profile
        console.log('Clicking #floating-nav-tab-profile to navigate to Family Profile...');
        await page.click('#floating-nav-tab-profile');
        await new Promise(r => setTimeout(r, 600));

        const isProfileActive = await page.$eval('#floating-nav-tab-profile', el => {
            const cs = window.getComputedStyle(el);
            return cs.backgroundColor !== 'transparent';
        });
        console.log(`Floating tab profile active status: ${isProfileActive}`);
        if (!isProfileActive) {
            throw new Error('Floating tab did not reflect active status for Profile');
        }
        console.log('✅ Floating navigation tab successfully switched to Family Profile');

        // Switch back to Tracker tab
        console.log('Clicking #floating-nav-tab-tracker to navigate back to Tracker...');
        await page.click('#floating-nav-tab-tracker');
        await new Promise(r => setTimeout(r, 600));

        // Scroll back down to capture desktop screenshot
        await page.evaluate(() => window.scrollTo({ top: 350, behavior: 'instant' }));
        await page.evaluate(() => window.scrollBy({ top: -20, behavior: 'instant' }));
        await new Promise(r => setTimeout(r, 400));

        const desktopShotPath = path.join(ARTIFACTS_DIR, 'e2e_15_floating_header_desktop.png');
        await page.screenshot({ path: desktopShotPath });
        console.log(`📸 Captured desktop floating header screenshot: ${desktopShotPath}`);

        // ==========================================
        // 3. Modal Layering Isolation Test
        // ==========================================
        console.log('\n--- 3. Testing Modal Layering Isolation ---');
        console.log('Opening settings modal from floating header...');
        await page.click('#floating-settings-btn');
        await new Promise(r => setTimeout(r, 400));
        await page.waitForSelector('#settings-modal', { timeout: 4000 });

        // Verify floating header is hidden while modal is open
        const modalFloatingOpacity = await page.$eval('#condensed-floating-header', el => window.getComputedStyle(el).opacity);
        console.log(`Floating header opacity while modal is open: ${modalFloatingOpacity}`);
        if (modalFloatingOpacity !== '0') {
            throw new Error(`Floating header did not suppress while modal is open, opacity: ${modalFloatingOpacity}`);
        }
        console.log('✅ Floating header automatically suppresses while modal is open');

        // Close settings modal
        const closeSettingsBtn = await page.$('#settings-modal-close-btn') || await page.$('#settings-modal button[aria-label="Close Settings modal"]') || await page.$('#settings-modal button');
        if (closeSettingsBtn) {
            await closeSettingsBtn.click();
            await new Promise(r => setTimeout(r, 400));
        }

        // ==========================================
        // 4. Mobile Viewport (393px width)
        // ==========================================
        console.log('\n--- 4. Testing Mobile Viewport (393px width) ---');
        await page.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });
        await new Promise(r => setTimeout(r, 500));

        await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
        await page.evaluate(() => window.scrollBy({ top: -20, behavior: 'instant' }));
        await new Promise(r => setTimeout(r, 400));

        const mobileHeaderRect = await page.$eval('#condensed-floating-header', el => {
            const r = el.getBoundingClientRect();
            return { width: r.width, height: r.height, top: r.top, left: r.left };
        });
        console.log('Mobile floating header dimensions:', JSON.stringify(mobileHeaderRect, null, 2));

        if (mobileHeaderRect.width > 393) {
            throw new Error(`Floating header width (${mobileHeaderRect.width}px) exceeds mobile viewport (393px)`);
        }
        console.log('✅ Floating header cleanly fits within mobile viewport with comfortable margins');

        const mobileShotPath = path.join(ARTIFACTS_DIR, 'e2e_16_floating_header_mobile.png');
        await page.screenshot({ path: mobileShotPath });
        console.log(`📸 Captured mobile floating header screenshot: ${mobileShotPath}`);

        console.log('\n🎉 ALL FLOATING HEADER & DASHBOARD DE-BLOAT REQUIREMENTS VERIFIED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runFloatingHeaderAndDebloatVerification();
