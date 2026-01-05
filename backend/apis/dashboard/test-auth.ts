// import crypto from 'crypto';
import { JSONCodec } from 'nats';
import { v4 } from 'uuid';
import { uuidv4 } from 'zod/v4';
// console.log(
//     crypto
//         .getRandomValues(new Uint8Array(32))
//         .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')
// );
// console.log(
//     crypto
//         .randomBytes(64)
//         .toString('base64url')
//         .replace(/_/g, '')
//         .replace(/-/g, '')
// );
// interface IGenerateOptions {
//     /** The desired length of the random part in bytes. 32 bytes (256 bits) is highly recommended. */
//     length?: number;
//     /** A human-readable prefix for easy identification. */
//     prefix?: string;
//     /** The version of the secret format. */
//     version?: string;
//     /** The encoding for the random and timestamp parts. 'base64url' is recommended for web safety. */
//     encoding?: 'base64url' | 'hex';
// }
// export function generateAdvancedWebhookSecret(
//     options: IGenerateOptions = {}
// ): string {
//     // تحديد القيم الافتراضية إذا لم يتم توفيرها
//     const {
//         length = 64, // 256 bits of entropy, extremely strong
//         prefix = 'websec',
//         version = 'v1',
//         encoding = 'base64url',
//     } = options;

//     if (length < 24) {
//         console.warn(
//             `Warning: Secret length is ${length} bytes. A length of 24 bytes or more is strongly recommended for robust security.`
//         );
//     }

//     const randomPart = crypto.randomBytes(length).toString(encoding);

//     const timestampBuffer = Buffer.alloc(6); // 64-bit integer for timestamp
//     timestampBuffer.writeBigInt64BE(BigInt(Date.now()));
//     const timestampPart = timestampBuffer.toString(encoding);

//     const secret = `${prefix}_${version}_${timestampPart}_${randomPart}`;

//     return secret.replace(/=/g, '');
// }
// console.log(generateAdvancedWebhookSecret());

// export function base62Encode(buf: Buffer): string {
//     const alphabet =
//         '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
//     let num = BigInt('0x' + buf.toString('hex'));
//     if (num === 0n) return '0';
//     let out = '';
//     while (num > 0n) {
//         const rem = Number(num % 62n);
//         out = alphabet[rem] + out;
//         num = num / 62n;
//     }
//     return out;
// }

// console.log(
//     base62Encode(Buffer.concat(crypto.getRandomValues(new Uint8Array(32))))
// );

const valid = [
    {
        webhookId: 'string',
        eventType: 'string',
        data: 'any',
        targets: [
            {
                targetUrl: 'string',
                targetId: 'string',
            },
        ],
        meta: {
            priority: 'high',
            maxRetries: 4,
            insertedAt: 'Date',
        },
    },
    {
        webhookId: 'string',
        eventType: 'string',
        data: 'any',
        targets: [
            {
                targetUrl: 'string',
                targetId: 'string',
            },
        ],
        meta: {
            priority: 'low',
            maxRetries: 4,
            insertedAt: 'Date',
        },
    },
];
const data = [];
for (let index = 0; index < valid.length; index++) {
    data.push({
        ...valid[index],
        eventId: v4(),
        workspaceId: 'c.user.workspaceId',
        webhookType: 'publish',
        timestamp: Date.now(),
    });
}

console.log(JSON.stringify(data));
