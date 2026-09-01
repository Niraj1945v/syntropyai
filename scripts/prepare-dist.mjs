import fs from "node:fs";
import path from "node:path";
import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

async function main() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, "dist");
  const shimPath = path.join(rootDir, "src", "lib", "start-client-shim.ts");

  console.log("Starting client SPA build for Netlify / static distribution...");

  try {
    // 1. Build standalone client SPA into dist/
    await build({
      root: rootDir,
      configFile: false,
      plugins: [tailwindcss(), tsconfigPaths(), react()],
      resolve: {
        alias: [
          { find: "@tanstack/react-start/server", replacement: shimPath },
          { find: "@tanstack/react-start/client", replacement: shimPath },
          { find: "@tanstack/react-start", replacement: shimPath },
          { find: "@", replacement: path.join(rootDir, "src") },
        ],
      },
      build: {
        outDir: "dist",
        emptyOutDir: true,
      },
    });

    console.log("Client SPA Vite build complete.");

    // 2. Ensure 200.html, 404.html, and _redirects for Netlify SPA routing
    const indexHtmlPath = path.join(distDir, "index.html");
    if (fs.existsSync(indexHtmlPath)) {
      const html = fs.readFileSync(indexHtmlPath, "utf8");
      fs.writeFileSync(path.join(distDir, "200.html"), html, "utf8");
      fs.writeFileSync(path.join(distDir, "404.html"), html, "utf8");
      fs.writeFileSync(path.join(distDir, "_redirects"), "/*    /index.html   200\n", "utf8");
      console.log("Created 200.html, 404.html, and _redirects in dist/");
    }

    // 3. Copy public assets (like favicon, _redirects, etc.)
    const publicDir = path.join(rootDir, "public");
    if (fs.existsSync(publicDir)) {
      for (const item of fs.readdirSync(publicDir)) {
        const src = path.join(publicDir, item);
        const dest = path.join(distDir, item);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
        }
      }
    }

    console.log("Distribution preparation finished successfully.");
  } catch (err) {
    console.error("Error during distribution build:", err);
    process.exit(1);
  }
}

main();
