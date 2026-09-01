import fs from "node:fs";
import path from "node:path";

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function main() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, "dist");
  const outputPublic = path.join(rootDir, ".output", "public");
  const outputServer = path.join(rootDir, ".output", "server");
  const outputDir = path.join(rootDir, ".output");

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Copy public output (assets, icons, etc.) to dist/
  if (fs.existsSync(outputPublic)) {
    for (const item of fs.readdirSync(outputPublic)) {
      copyRecursive(path.join(outputPublic, item), path.join(distDir, item));
    }
    console.log("Copied .output/public files to dist/");
  }

  // 2. Copy server output to dist/server
  if (fs.existsSync(outputServer)) {
    copyRecursive(outputServer, path.join(distDir, "server"));
    console.log("Copied .output/server files to dist/server");
  }

  // 3. Find CSS and JS assets in dist/assets
  const assetsDir = path.join(distDir, "assets");
  let cssFile = "";
  let jsFiles = [];

  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    for (const file of assets) {
      if (file.endsWith(".css") && !cssFile) {
        cssFile = `/assets/${file}`;
      }
      if (file.endsWith(".js")) {
        jsFiles.push(`/assets/${file}`);
      }
    }
  }

  // Find index and routes JS
  const indexJs = jsFiles.find((f) => f.includes("index-")) || jsFiles[0] || "";
  const routesJs = jsFiles.find((f) => f.includes("routes-")) || "";

  // 4. Generate dist/index.html
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QueueSense.ai — AI Queue & Crowd Optimization</title>
    <meta name="description" content="Privacy-conscious AI platform that forecasts demand, estimates waiting time and allocates counters fairly in high-footfall public facilities." />
    <meta property="og:title" content="QueueSense.ai — AI Queue & Crowd Optimization" />
    <meta property="og:description" content="Forecast demand, cut waiting time and protect fairness for vulnerable and time-critical visitors." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.ico" type="image/x-icon" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500;700&display=swap" />
    ${cssFile ? `<link rel="stylesheet" href="${cssFile}" />` : ""}
  </head>
  <body class="bg-background text-foreground">
    <div id="root"></div>
    ${routesJs ? `<script type="module" src="${routesJs}"></script>` : ""}
    ${indexJs ? `<script type="module" src="${indexJs}"></script>` : ""}
  </body>
</html>
`;

  fs.writeFileSync(path.join(distDir, "index.html"), htmlContent, "utf8");
  fs.writeFileSync(path.join(distDir, "200.html"), htmlContent, "utf8");
  fs.writeFileSync(path.join(distDir, "404.html"), htmlContent, "utf8");
  fs.writeFileSync(path.join(distDir, "_redirects"), "/*    /index.html   200\n", "utf8");
  console.log("Created dist/index.html, dist/200.html, dist/404.html, and dist/_redirects");

  console.log("Build distribution preparation finished successfully.");
}

main();
