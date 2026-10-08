const fs = require('fs');
const path = require('path');

const brainUploadedDir = path.join('C:', 'Users', 'Admin', '.gemini', 'antigravity', 'brain', '366228ce-929e-45fb-a064-383845b5626d', '.user_uploaded');
const figuresDir = path.join(__dirname, '..', 'docs', 'figures');

if (!fs.existsSync(figuresDir)) {
    fs.mkdirSync(figuresDir, { recursive: true });
}

// 1. Copy user uploaded screenshots
const filesToCopy = [
    { src: 'media_1790815749023.png', dest: 'screenshot_post_project_metamask.png' },
    { src: 'media_1790785057421.png', dest: 'screenshot_wallet_required_banner.png' },
    { src: 'media_1790778803910.jpg', dest: 'screenshot_project_detail_mobile.jpg' },
    { src: 'media_1790778788507.jpg', dest: 'screenshot_ask_ai_chat.jpg' },
    { src: 'media_1790778814147.jpg', dest: 'screenshot_ask_ai_dispute_sepolia.jpg' }
];

filesToCopy.forEach(f => {
    const srcPath = path.join(brainUploadedDir, f.src);
    const destPath = path.join(figuresDir, f.dest);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied: ${f.dest} (${(fs.statSync(destPath).size / 1024).toFixed(1)} KB)`);
    } else {
        console.warn(`Source not found: ${srcPath}`);
    }
});

console.log("Screenshots copy complete.");
