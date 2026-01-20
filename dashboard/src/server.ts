import { APP_BASE_HREF } from "@angular/common";
import { CommonEngine, isMainModule } from "@angular/ssr/node";
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import bootstrap from "./main.server";

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, "../browser");
const indexHtml = join(browserDistFolder, "index.csr.html");

console.log("Initializing server.ts...");

const app = express();
console.log("Express app created.");

const commonEngine = new CommonEngine();
console.log("CommonEngine created.");

/**
 * Serve static files from /browser
 * Using app.use with express.static is the standard way to serve files
 * and avoids regex issues with newer path-to-regexp versions.
 */
console.log("Configuring static files...");
app.use(
  express.static(browserDistFolder, {
    maxAge: "1y",
    index: "index.html",
  }),
);
console.log("Static files configured.");

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Client server is healthy",
      services: {
        server: {
          status: "healthy",
          details: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
          },
        },
      },
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  }
});

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

console.log("Routes configured.");

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env["pm_id"]) {
  const port = Number(process.env["PORT"]) || 4000;
  console.log(`Starting server on port ${port}...`);
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
