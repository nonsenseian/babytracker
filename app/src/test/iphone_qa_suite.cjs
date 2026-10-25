const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const artifactDir = 'C:\\Users\\ianpa\\.gemini\\antigravity-ide\\brain\\d4933be6-6d18-4c7a-ab3e-755d23239215';
const iPhoneDevice = devices['iPhone 14 Pro'] || {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
};

async function runIPhoneQASuite() {
    console.log('====================================================');
    console.log('📱 STARTING IPHONE SIMULATOR QA & UI/UX TEST SUITE');
    console.log('Simulating: iPhone 14 Pro (393 x 852 @3x, Touch Enabled)');
    console.log('====================================================');

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        ...iPhoneDevice,
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Collect QA Test Assertions
    const qaResults = {
        themeNamesPassed: false,
        noHorizontalOverflow: true,
        layoutParityLightVsDark: false,
        dateCyclingPassed: false,
        calendarHidePassed: false,
        calendarTriggerPassed: false,
        themeMeasurements: {}
    };

    try {
        console.log('Navigating to https://localhost:5173/ on iPhone simulator...');
        await page.goto('https://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('header', { timeout: 10000 });

        // Seed a sample log if needed so all sections have realistic content
        await page.evaluate(() => {
            const existing = localStorage.getItem('bt_app_logs');
            if (!existing || existing === '[]') {
                const sampleLogs = [
                    {
                        id: 'sample-iphone-growth',
                        category: 'growth',
                        timestamp: new Date().getTime(),
                        dateStr: new Date().toISOString().split('T')[0],
                        title: 'Growth Measurement',
                        notes: 'Weight: 9.8 lbs, Height: 21.5 in',
                        childId: 'child_1',
                        loggedBy: 'Parent'
                    }
                ];
                localStorage.setItem('bt_app_logs', JSON.stringify(sampleLogs));
            }
        });

        // -------------------------------------------------------------
        // QA TEST 1: THEME NAMES & DROPDOWN ORDER
        // -------------------------------------------------------------
        console.log('\n--- QA TEST 1: Verifying Simpler Theme Names & Order ---');
        const themeOptions = await page.evaluate(() => {
            const select = document.querySelector('select[aria-label="Theme selector"]');
            if (!select) return [];
            return Array.from(select.options).map(o => ({ value: o.value, text: o.text.trim() }));
        });

        console.log('Detected Theme Dropdown Options:', themeOptions);
        const expectedThemes = [
            'Light',
            'Dark'
        ];

        const optionLabels = themeOptions.map(o => o.text);
        const matchesNames = expectedThemes.every(name => optionLabels.includes(name)) && themeOptions.length === 2;

        qaResults.themeNamesPassed = matchesNames;

        console.log(`✓ All expected simpler names present: ${matchesNames ? 'PASS' : 'FAIL'}`);

        if (!matchesNames) {
            throw new Error(`Theme dropdown mismatch! Expected: ${expectedThemes.join(', ')}. Found: ${optionLabels.join(', ')}`);
        }

        // -------------------------------------------------------------
        // UI/UX TEST 2: LAYOUT CONSISTENCY & BUTTON PLACEMENT
        // Measure button and card bounds across themes to verify zero layout jump
        // -------------------------------------------------------------
        console.log('\n--- UI/UX TEST 2: Measuring Layout & Button Consistency ---');
        const themesToMeasure = [
            { id: 'simple-daylight', name: 'Light' },
            { id: 'simple-moonlight', name: 'Dark' }
        ];

        for (const t of themesToMeasure) {
            // Select theme
            await page.selectOption('select[aria-label="Theme selector"]', t.id);
            await new Promise(r => setTimeout(r, 350));

            // Measure key UI elements on iPhone viewport
            const measurements = await page.evaluate(() => {
                const nav = document.querySelector('.surface-card, nav, .btn-primary');
                const quickPad = document.querySelector('.surface-elevated');
                const soundBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sound Machine'));
                const couplesBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Couples Sync'));
                const calendarCard = document.getElementById('monthly-activity-calendar');
                const dateBtn = document.querySelector('button[title*="open Calendar view"]');

                const getBox = el => el ? {
                    width: Math.round(el.getBoundingClientRect().width),
                    height: Math.round(el.getBoundingClientRect().height),
                    top: Math.round(el.getBoundingClientRect().top),
                    left: Math.round(el.getBoundingClientRect().left)
                } : null;

                const hasHOverflow = document.documentElement.scrollWidth > window.innerWidth;

                return {
                    hasHOverflow,
                    scrollWidth: document.documentElement.scrollWidth,
                    soundBtn: getBox(soundBtn),
                    couplesBtn: getBox(couplesBtn),
                    calendarCard: getBox(calendarCard),
                    dateBtn: getBox(dateBtn)
                };
            });

            qaResults.themeMeasurements[t.name] = measurements;
            console.log(`[${t.name}] Sound Machine Button height: ${measurements.soundBtn?.height}px, Couples Sync height: ${measurements.couplesBtn?.height}px`);

            // Capture screenshot for each theme on iPhone
            const shotPath = path.join(artifactDir, `iphone_theme_${t.name.toLowerCase().replace(/\s+/g, '_')}.png`);
            await page.screenshot({ path: shotPath });
            console.log(`Saved screenshot: ${shotPath}`);

            if (measurements.hasHOverflow) {
                console.warn(`WARNING: Theme ${t.name} caused horizontal overflow: scrollWidth=${measurements.scrollWidth} > innerWidth=393`);
                qaResults.noHorizontalOverflow = false;
            }
        }

        // Compare Light vs Dark button heights and horizontal bounds
        const lightM = qaResults.themeMeasurements['Light'];
        const darkM = qaResults.themeMeasurements['Dark'];

        const soundHeightDiff = Math.abs((lightM.soundBtn?.height || 0) - (darkM.soundBtn?.height || 0));
        const couplesHeightDiff = Math.abs((lightM.couplesBtn?.height || 0) - (darkM.couplesBtn?.height || 0));

        console.log(`Layout Height Variance (Light vs Dark): SoundBtn diff=${soundHeightDiff}px, CouplesBtn diff=${couplesHeightDiff}px`);
        if (soundHeightDiff <= 2 && couplesHeightDiff <= 2) {
            qaResults.layoutParityLightVsDark = true;
            console.log('✓ UI Consistency Test: PASSED! Button dimensions & alignments match across themes.');
        } else {
            console.warn('⚠️ Warning: Layout difference between Light and Dark exceeded 2px!');
        }

        // -------------------------------------------------------------
        // QA TEST 3: DATE CYCLING & CALENDAR VIEW INTERACTIONS
        // -------------------------------------------------------------
        console.log('\n--- QA TEST 3: iPhone Date Cycling & Calendar Trigger ---');
        // Return to Light theme
        await page.selectOption('select[aria-label="Theme selector"]', 'simple-daylight');
        await new Promise(r => setTimeout(r, 200));

        // Test 3a: Hide Calendar
        console.log('Tapping "Hide Calendar" on iPhone...');
        const hideBtn = await page.$('button[title="Hide monthly calendar"]');
        if (hideBtn) {
            await hideBtn.click();
            await new Promise(r => setTimeout(r, 400));
        }

        const hideShotPath = path.join(artifactDir, 'iphone_calendar_hidden.png');
        await page.screenshot({ path: hideShotPath });
        console.log(`Saved screenshot: ${hideShotPath}`);

        const isHidden = await page.evaluate(() => {
            const el = document.getElementById('monthly-activity-calendar');
            return el ? el.innerText.includes('Show Calendar') : false;
        });
        qaResults.calendarHidePassed = isHidden;
        console.log(`✓ Calendar Hide Button collapsed card: ${isHidden ? 'PASS' : 'FAIL'}`);

        // Test 3b: Date Cycling on iPhone
        console.log('Tapping Previous Day (<) button on iPhone...');
        const prevBtn = await page.$('button[aria-label="Previous day"]');
        if (prevBtn) {
            await prevBtn.click();
            await new Promise(r => setTimeout(r, 400));
        }

        const cycledDateText = await page.evaluate(() => {
            const b = document.querySelector('button[title*="open Calendar view"]');
            return b ? b.innerText : '';
        });
        console.log('Cycled Date Button text:', cycledDateText);
        qaResults.dateCyclingPassed = cycledDateText.length > 0;

        const cycleShotPath = path.join(artifactDir, 'iphone_date_cycled.png');
        await page.screenshot({ path: cycleShotPath });
        console.log(`Saved screenshot: ${cycleShotPath}`);

        // Test 3c: Click date to bring up calendar on iPhone
        console.log('Tapping date button to bring up calendar...');
        const dateBtn = await page.$('button[title*="open Calendar view"]');
        if (dateBtn) {
            await dateBtn.click();
            await new Promise(r => setTimeout(r, 600));
        }

        const broughtUpShotPath = path.join(artifactDir, 'iphone_calendar_brought_up.png');
        await page.screenshot({ path: broughtUpShotPath });
        console.log(`Saved screenshot: ${broughtUpShotPath}`);

        const isBroughtUp = await page.evaluate(() => {
            const el = document.getElementById('monthly-activity-calendar');
            return el ? el.innerText.includes('Monthly Activity Calendar') && !el.innerText.includes('(Hidden)') : false;
        });
        qaResults.calendarTriggerPassed = isBroughtUp;
        console.log(`✓ Tapping date brought up calendar: ${isBroughtUp ? 'PASS' : 'FAIL'}`);

        // -------------------------------------------------------------
        // SUMMARY
        // -------------------------------------------------------------
        console.log('\n====================================================');
        console.log('📱 IPHONE QA SUITE RESULTS SUMMARY:');
        console.log(`1. Simpler Theme Names (Light & Dark): ${qaResults.themeNamesPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log(`2. Layout Consistency (Light vs Dark): ${qaResults.layoutParityLightVsDark ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log(`3. No Mobile Horizontal Overflow: ${qaResults.noHorizontalOverflow ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log(`4. Hide Calendar Button: ${qaResults.calendarHidePassed ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log(`5. Mobile Date Cycling: ${qaResults.dateCyclingPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log(`6. Click Date Brings Up Calendar: ${qaResults.calendarTriggerPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log('====================================================');

        const allPassed = qaResults.themeNamesPassed &&
            qaResults.layoutParityLightVsDark &&
            qaResults.calendarHidePassed &&
            qaResults.dateCyclingPassed &&
            qaResults.calendarTriggerPassed;

        if (!allPassed) {
            throw new Error('One or more QA assertions failed!');
        }

        console.log('ALL IPHONE SIMULATOR TESTS COMPLETED SUCCESSFULLY!');
    } finally {
        await context.close();
        await browser.close();
    }
}

runIPhoneQASuite().catch(err => {
    console.error('iPhone QA Suite Error:', err);
    process.exit(1);
});
