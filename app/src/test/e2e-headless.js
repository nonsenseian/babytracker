import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../../dist');

// Find chrome or edge path
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

// Simple static server for dist
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(distDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } else {
        const indexPath = path.join(distDir, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream(indexPath).pipe(res);
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    }
});

server.listen(4179, async () => {
    console.log(`Local test server running at http://localhost:4179`);
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900 });
        await page.goto('http://localhost:4179/', { waitUntil: 'networkidle0' });

        console.log('Page loaded successfully. Checking UI titles and cards...');

        const title = await page.title();
        console.log(`App Title: ${title}`);

        // Check for Piano Lullaby text
        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasBrahms = /brahm/i.test(bodyText);
        console.log(`Contains any 'Brahms' text: ${hasBrahms ? 'YES (FAIL)' : 'NO (PASSED)'}`);

        // Check reminders
        const feedCard = await page.$('#feed-reminder-card') || await page.$('.surface-card');
        console.log(`Surface card detected: ${!!feedCard}`);

        const screenshotPath = path.resolve(distDir, '../e2e_verified.png');
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`E2E screenshot saved to: ${screenshotPath}`);

        if (hasBrahms) {
            throw new Error("Found unwanted Brahms text on page!");
        }

        console.log('All E2E checks passed successfully!');
    } catch (err) {
        console.error('E2E Test Error:', err);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        server.close();
    }
});
