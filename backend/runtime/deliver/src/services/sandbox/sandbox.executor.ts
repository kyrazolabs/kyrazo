import { logger } from '@kyrazo/shared';

export interface SandboxResult {
    success: boolean;
    result?: any;
    error?: string;
    logs?: string[];
}

/**
 * 🔒 Sandbox Executor
 * Manages the lifecycle of Bun Workers for user code execution.
 * Enforces hard timeouts and provides a fail-safe execution environment.
 */
export class SandboxExecutor {
    private static instance: SandboxExecutor;
    // Resolve path relative to this file
    private workerPath = new URL('./sandbox.worker.ts', import.meta.url).href;

    private constructor() {}

    public static getInstance(): SandboxExecutor {
        if (!SandboxExecutor.instance) {
            SandboxExecutor.instance = new SandboxExecutor();
        }
        return SandboxExecutor.instance;
    }

    /**
     * Executes JS code in a sandboxed Bun Worker.
     * @param code The JS code to execute.
     * @param payload The input object (event payload).
     * @returns Promise<SandboxResult>
     */
    public async execute(code: string, payload: any): Promise<SandboxResult> {
        return new Promise((resolve) => {
            // Log capturing is enabled only in test environments
            const testMode =
                process.env.NODE_ENV === 'test' || process.env.SANDBOX_TEST_MODE === 'true';

            /**
             * 🧵 Worker Initialization
             * We spawn a fresh worker per execution to prevent cross-contamination
             * and ensure zero shared state between different customer transforms.
             */
            const worker = new Worker(this.workerPath);

            /**
             * ⏱️ Safety Timeout
             * Requirement: Hard 2-second timeout with automatic worker.terminate().
             */
            const timeout = setTimeout(() => {
                logger.warn(`[Sandbox] Execution timed out after 2000ms. Terminating worker.`);
                worker.terminate();
                resolve({
                    success: false,
                    error: 'Execution Timed Out (2000ms)',
                });
            }, 2000);

            worker.onmessage = (event) => {
                clearTimeout(timeout);
                // Worker is terminated immediately after completion to free resources
                worker.terminate();
                resolve(event.data);
            };

            // Handle unexpected worker-level errors
            worker.onerror = (error) => {
                clearTimeout(timeout);
                worker.terminate();
                logger.error(`[Sandbox] Worker Level Error: ${error.message}`);
                resolve({
                    success: false,
                    error: error.message,
                });
            };

            // Send payload and code to the sandbox
            worker.postMessage({ code, payload, testMode });
        });
    }
}

export const sandboxExecutor = SandboxExecutor.getInstance();
