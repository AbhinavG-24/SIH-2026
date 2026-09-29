import fs from 'fs';
import path from 'path';

// Read dist/index.html produced by Vite build
let distHtml = fs.readFileSync('./dist/index.html', 'utf8');

// Strip type="module" and crossorigin attributes so browser treats app.js as a classic IIFE script on file://
distHtml = distHtml.replace(/type="module"\s+crossorigin\s+/g, '');
distHtml = distHtml.replace(/crossorigin\s+/g, '');

fs.writeFileSync('./dist/index.html', distHtml);

// Copy dist/assets to ./assets for root index.html compatibility
if (!fs.existsSync('./assets')) {
    fs.mkdirSync('./assets');
}

const assets = fs.readdirSync('./dist/assets');
assets.forEach(file => {
    fs.copyFileSync(path.join('./dist/assets', file), path.join('./assets', file));
});

// Update root index.html so double-clicking root index.html runs app.js directly without CORS issues
const rootHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASIE — Adaptive Sonar Intelligence Engine</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./assets/app.css">
</head>
<body>
    <div id="root"></div>
    <script src="./assets/app.js"></script>
</body>
</html>`;

fs.writeFileSync('./index.html', rootHtml);

// Update dashboard/index.html
const dashHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASIE — Adaptive Sonar Intelligence Engine</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/app.css">
</head>
<body>
    <div id="root"></div>
    <script src="../assets/app.js"></script>
</body>
</html>`;

fs.writeFileSync('./dashboard/index.html', dashHtml);

console.log('[ASIE Postbuild] SUCCESS! All index.html files configured for zero-CORS file:// double-clicking!');
