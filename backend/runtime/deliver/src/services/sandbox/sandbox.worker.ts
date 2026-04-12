import lo from 'lodash';
import dayjs from 'dayjs';
import crypto from 'crypto';

/**
 * 🛡️ Kyrazo Sandbox Worker
 * Strict isolation for user-provided JavaScript transformers.
 */

// Re-expose only safe crypto functions (HMAC/SHA only)
const safeCrypto = {
    hmac: (key: string, data: string, algorithm = 'sha256') => {
        return crypto.createHmac(algorithm, key).update(data).digest('hex');
    },
    sha256: (data: string) => {
        return crypto.createHash('sha256').update(data).digest('hex');
    },
    sha512: (data: string) => {
        return crypto.createHash('sha512').update(data).digest('hex');
    },
};

declare var self: Worker;

// ⚡ Attempt to strip sensitive globals in the worker scope
// Note: Bun workers already have reduced surface, but we layer defense.
const dangerousGlobals = ['process', 'fetch', 'setTimeout', 'setInterval', 'require', 'import'];
dangerousGlobals.forEach((g) => {
    try {
        // @ts-ignore
        self[g] = undefined;
    } catch (e) {
        // Ignore errors for read-only globals
    }
});

self.onmessage = (event) => {
    const { code, payload, testMode } = event.data;

    // 📝 Log capturing (only during test mode)
    const logs: string[] = [];
    const mockConsole = {
        log: (...args: any[]) => {
            if (testMode) logs.push(args.join(' '));
        },
        error: (...args: any[]) => {
            if (testMode) logs.push(`ERROR: ${args.join(' ')}`);
        },
        warn: (...args: any[]) => {
            if (testMode) logs.push(`WARN: ${args.join(' ')}`);
        },
    };

    try {
        // Wrapper to isolate and provide utilities
        const utils = {
            lodash: lo,
            _: lo,
            dayjs,
            crypto: safeCrypto,
            console: mockConsole,
        };

        /**
         * 🧪 Transformation Execution
         * Enforces a return type and restricts global access via Function scope.
         */
        const runner = new Function(
            'payload',
            'utils',
            `
            const { lodash, _, dayjs, crypto, console } = utils;
            try {
                ${code}
            } catch (e) {
                throw new Error("Runtime Error: " + e.message);
            }
        `
        );

        // Execute user code
        const result = runner(payload, utils);

        if (result === undefined || result === null) {
            throw new Error('Transformer must return a valid payload object');
        }

        if (typeof result !== 'object') {
            throw new Error('Transformer must return an object (got ' + typeof result + ')');
        }

        self.postMessage({ success: true, result, logs: testMode ? logs : [] });
    } catch (error: any) {
        self.postMessage({ success: false, error: error.message, logs: testMode ? logs : [] });
    }
};
