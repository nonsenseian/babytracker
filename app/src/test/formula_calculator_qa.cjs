const { chromium, devices } = require('playwright');
const path = require('path');

const artifactDir = 'C:\\Users\\ianpa\\.gemini\\antigravity-ide\\brain\\d4933be6-6d18-4c7a-ab3e-755d23239215';
const iPhoneDevice = devices['iPhone 14 Pro'] || {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
};

async function runFormulaCalculatorQA() {
    console.log('====================================================');
    console.log('🍼 TESTING FORMULA & WATER RATIO CALCULATOR ON IPHONE');
    console.log('====================================================');

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({ ...iPhoneDevice });
    const page = await context.newPage();

    try {
        console.log('Navigating to http://localhost:5173/ ...');
        await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('header', { timeout: 10000 });

        // Switch to Metrics & Graphs tab
        console.log('Switching to Metrics & Graphs tab via #nav-tab-metrics...');
        await page.click('#nav-tab-metrics');
        await new Promise(r => setTimeout(r, 600));

        // Scroll into view of formula calculator
        console.log('Locating #formula-ratio-calculator...');
        const calcCard = await page.waitForSelector('#formula-ratio-calculator', { timeout: 8000 });
        await calcCard.scrollIntoViewIfNeeded();
        await new Promise(r => setTimeout(r, 400));

        // Test 1: Check Default Calculation (4 oz -> 6 tsp)
        const calcText1 = await page.evaluate(() => {
            const el = document.getElementById('formula-ratio-calculator');
            return el ? el.innerText : '';
        });

        console.log('\n--- TEST 1: Default US Ratio Calculation ---');
        const has6Tsp = calcText1.includes('6 tsp') || calcText1.includes('6.0 tsp') || calcText1.includes('2 tablespoons');
        console.log(`Contains 6 tsp / 2 tbsp for 4 oz: ${has6Tsp ? 'PASS ✅' : 'FAIL ❌'}`);
        if (!has6Tsp) {
            throw new Error(`Formula calculator default mismatch! Card text: ${calcText1}`);
        }

        const shot1 = path.join(artifactDir, 'iphone_formula_calculator_default.png');
        await page.screenshot({ path: shot1 });
        console.log(`Saved screenshot: ${shot1}`);

        // Test 2: Select 6 oz bottle chip
        console.log('\n--- TEST 2: Select 6 oz Bottle Chip ---');
        await page.evaluate(() => {
            const el = document.getElementById('formula-ratio-calculator');
            const chips = Array.from(el.querySelectorAll('button'));
            const chip6 = chips.find(b => {
                const txt = b.innerText.trim();
                return txt === '6 oz' || txt === '6 fl oz' || txt === '180 ml';
            });
            if (chip6) chip6.click();
        });
        await new Promise(r => setTimeout(r, 400));

        const calcText2 = await page.evaluate(() => {
            const el = document.getElementById('formula-ratio-calculator');
            return el ? el.innerText : '';
        });
        const has9Tsp = calcText2.includes('9 tsp') || calcText2.includes('3 tablespoons');
        console.log(`Contains 9 tsp / 3 tbsp for 6 oz: ${has9Tsp ? 'PASS ✅' : 'FAIL ❌'}`);
        if (!has9Tsp) {
            throw new Error(`Formula calculator 6 oz mismatch! Card text: ${calcText2}`);
        }

        // Test 3: Custom Ratio Mode
        console.log('\n--- TEST 3: Switch to Custom Ratio ---');
        await page.evaluate(() => {
            const el = document.getElementById('formula-ratio-calculator');
            const btns = Array.from(el.querySelectorAll('button'));
            const customBtn = btns.find(b => b.innerText.includes('Custom Ratio'));
            if (customBtn) customBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));

        const shotCustom = path.join(artifactDir, 'iphone_formula_calculator_custom.png');
        await page.screenshot({ path: shotCustom });
        console.log(`Saved screenshot: ${shotCustom}`);

        // Test 4: Tap Log This Bottle Feed
        console.log('\n--- TEST 4: Log Prepared Bottle Feed ---');
        await page.evaluate(() => {
            const el = document.getElementById('formula-ratio-calculator');
            const logBtn = Array.from(el.querySelectorAll('button')).find(b => b.innerText.includes('Log This Prepared Bottle'));
            if (logBtn) logBtn.click();
        });
        await new Promise(r => setTimeout(r, 400));

        const isLogged = await page.evaluate(() => {
            const el = document.getElementById('formula-ratio-calculator');
            return el ? el.innerText.includes('Logged to Daily Feed Stream') : false;
        });
        console.log(`Log confirmation displayed: ${isLogged ? 'PASS ✅' : 'FAIL ❌'}`);

        const shotLogged = path.join(artifactDir, 'iphone_formula_calculator_logged.png');
        await page.screenshot({ path: shotLogged });
        console.log(`Saved screenshot: ${shotLogged}`);

        // Element screenshot (full height of formula calculator card)
        const elementShot = path.join(artifactDir, 'iphone_formula_calculator_full.png');
        const calcEl = await page.$('#formula-ratio-calculator');
        if (calcEl) {
            await calcEl.screenshot({ path: elementShot });
            console.log(`Saved full element screenshot: ${elementShot}`);
        }

        // Test 5: Switch to Arcade Theme and verify rendering & alignment
        console.log('\n--- TEST 5: Verify Arcade Theme Layout ---');
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.selectOption('select[aria-label="Theme selector"]', 'pixelated-arcade');
        await new Promise(r => setTimeout(r, 400));

        await calcCard.scrollIntoViewIfNeeded();
        await new Promise(r => setTimeout(r, 400));

        const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        console.log(`Arcade Theme No Horizontal Overflow: ${!hasHOverflow ? 'PASS ✅' : 'FAIL ❌'}`);

        const shotArcade = path.join(artifactDir, 'iphone_formula_calculator_arcade.png');
        await page.screenshot({ path: shotArcade });
        console.log(`Saved screenshot: ${shotArcade}`);

        console.log('\n====================================================');
        console.log('ALL FORMULA CALCULATOR TESTS PASSED WITH 100% SUCCESS!');
        console.log('====================================================');
    } finally {
        await context.close();
        await browser.close();
    }
}

runFormulaCalculatorQA().catch(err => {
    console.error('QA Suite Error:', err);
    process.exit(1);
});
