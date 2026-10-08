const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'fairwork-frontend', 'node_modules', '@playwright', 'test'));

const distDir = path.join(__dirname, '..', 'fairwork-frontend', 'dist');
const figuresDir = path.join(__dirname, '..', 'docs', 'figures');

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
  if (reqPath === '/' || !path.extname(reqPath)) {
    reqPath = '/index.html';
  }
  const filePath = path.join(distDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback
    const indexPath = path.join(distDir, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

server.listen(4173, async () => {
  console.log('Static preview server running on port 4173');
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2
    });

    // 1. Landing Page
    console.log('Capturing Landing Page...');
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const landingDest = path.join(figuresDir, 'screenshot_landing_page.png');
    await page.screenshot({ path: landingDest, fullPage: false });
    console.log(`✓ Captured Landing Page (${(fs.statSync(landingDest).size / 1024).toFixed(1)} KB)`);

    // 2. Escrow Blueprint Section
    console.log('Capturing Escrow Blueprint section...');
    const blueprintEl = await page.$('section, [class*="blueprint"], [class*="escrow"]');
    if (blueprintEl) {
      await page.evaluate(() => window.scrollBy(0, 700));
      await page.waitForTimeout(500);
      const blueprintDest = path.join(figuresDir, 'screenshot_landing_blueprint.png');
      await page.screenshot({ path: blueprintDest, fullPage: false });
      console.log(`✓ Captured Blueprint section (${(fs.statSync(blueprintDest).size / 1024).toFixed(1)} KB)`);
    }

    // 3. Projects Marketplace
    console.log('Capturing Projects Marketplace...');
    await page.goto('http://localhost:4173/projects', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const projectsDest = path.join(figuresDir, 'screenshot_projects_marketplace.png');
    await page.screenshot({ path: projectsDest, fullPage: false });
    console.log(`✓ Captured Projects Marketplace (${(fs.statSync(projectsDest).size / 1024).toFixed(1)} KB)`);

    await browser.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    server.close();
    console.log('Done capturing live screenshots.');
  }
});
