import { APP_BASE_HREF } from "@angular/common";
import { CommonEngine } from "@angular/ssr/node";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative } from "node:path";
import bootstrap from "./main.server";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile } from "node:fs/promises";

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, "../browser");
const indexHtmlPath = join(browserDistFolder, "index.csr.html");

const app = new Hono();
const commonEngine = new CommonEngine();

/**
 * Serve CSR App Shell for Dashboard
 * explicit route takes precedence
 */
app.get("/dashboard/*", async (c) => {
  try {
    const html = await readFile(indexHtmlPath, "utf-8");
    return c.html(html);
  } catch (error) {
    console.error("Error serving dashboard shell:", error);
    return c.text("Internal Server Error", 500);
  }
});

/**
 * Serve static files from /browser
 * Using relative path from process.cwd() is safer for serveStatic in some versions,
 * but let's try strict mapping.
 */
// Calculate relative path from CWD to dist/browser for serveStatic
const relativeBrowserPath = relative(process.cwd(), browserDistFolder);

app.use(
  "/*",
  serveStatic({
    root: relativeBrowserPath,
    index: "index.html", // Serve index.html for root if exists (Prerendered Landing)
    onNotFound: (path, c) => {
      // If not found, fall through to next handler (SSR)
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get("*", async (c) => {
  try {
    const renderedHtml = await commonEngine.render({
      bootstrap,
      documentFilePath: indexHtmlPath,
      url: c.req.url, // Full URL including auth/host
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: "/" }], // Default base href
    });
    return c.html(renderedHtml);
  } catch (error) {
    console.error("SSR Error:", error);
    return c.text("Internal Server Error", 500);
  }
});

const port = Number(process.env["PORT"]) || 4000;
console.log(`Starting Hono server on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
