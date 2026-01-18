import { APP_BASE_HREF } from "@angular/common";
import { CommonEngine, isMainModule } from "@angular/ssr/node";
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import bootstrap from "./main.server";

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, "../browser");
const indexHtml = join(browserDistFolder, "index.csr.html");

const app = express();
const commonEngine = new CommonEngine();

/**
 * Serve static files from /browser
 * Using app.use with express.static is the standard way to serve files
 * and avoids regex issues with newer path-to-regexp versions.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: "1y",
    index: "index.html",
  }),
);

/**
 * Serve CSR App Shell for Dashboard
 */
app.get("/dashboard/*", (req, res) => {
  res.sendFile(indexHtml);
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get("*", (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env["pm_id"]) {
  const port = Number(process.env["PORT"]) || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
