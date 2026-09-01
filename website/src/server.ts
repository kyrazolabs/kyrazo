import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { join } from 'node:path';
import { statSync } from 'node:fs';

const angularApp = new AngularAppEngine();

// In Bun, import.meta.dir is equivalent to __dirname
// When built, server.mjs is usually in dist/website/server, and browser is in dist/website/browser
const browserDistFolder = join(import.meta.dirname, '../browser');

/**
 * Handle all requests by serving static files or rendering the Angular application.
 */
async function handleRequest(req: Request) {
    const url = new URL(req.url);

    // 0. Healthcheck endpoint (used by the Docker HEALTHCHECK)
    if (url.pathname === '/health') {
        return new Response('OK');
    }

    // 1. Serve static files from /browser
    if (url.pathname !== '/') {
        const filePath = join(browserDistFolder, url.pathname);
        try {
            const stat = statSync(filePath);
            if (stat.isFile()) {
                // Return static file using Bun.file
                return new Response(Bun.file(filePath));
            }
        } catch (e) {
            // File not found, fall through to Angular SSR
        }
    }

    // 2. Let Angular handle the request
    const response = await angularApp.handle(req);
    if (response) {
        return response;
    }

    // 3. Fallback to 404
    return new Response('Not Found', { status: 404 });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Cloud Functions.
 */
export const reqHandler = createRequestHandler(handleRequest);

/**
 * Start the server if this module is the main entry point
 */
if (import.meta.main) {
    const port = Number(process.env['PORT']) || 4000;
    
    Bun.serve({
        port,
        fetch: handleRequest
    });

    console.log(`Server running on port ${port}`);
}
