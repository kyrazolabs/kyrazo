import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 9;

export function generateIngressId(userId: string): string {
    const timestamp = process.hrtime.bigint().toString();
    const input = `${userId}-${timestamp}`;

    const secretKey = 'SuperSecretKey123!'; // ممكن تخزنه في env
    const hash = crypto.createHmac('sha256', secretKey).update(input).digest();

    let result = '';
    for (let i = 0; i < ID_LENGTH; i++) {
        const index = Number(hash[i]) % ALPHABET.length;
        result += ALPHABET[index];
    }

    return result;
}

/**
 * @title Simple Base62 encode for buffers.
 * @param buf A string which wanted to encode
 */
export function base62Encode(buf: Buffer): string {
    const alphabet =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let num = BigInt('0x' + buf.toString('hex'));
    if (num === 0n) return '0';
    let out = '';
    while (num > 0n) {
        const rem = Number(num % 62n);
        out = alphabet[rem] + out;
        num = num / 62n;
    }
    return out;
}

/**
 * @title Simple Base62 decode to Buffer.
 * @param s An encoded string which wanted to decode
 */
export function base62Decode(s: string): Buffer {
    const alphabet =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let num = 0n;
    for (const ch of s) {
        const idx = BigInt(alphabet.indexOf(ch));
        if (idx < 0n) throw new Error('Invalid base62 char');
        num = num * 62n + idx;
    }
    let hex = num.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    return Buffer.from(hex, 'hex');
}

// export async function verifySignature(event: any, headers: any) {

//     const transmissionId = headers['paypal-transmission-id']
//     const timeStamp = headers['paypal-transmission-time']
//     const crc = parseInt("0x" + crc32(event).toString('hex')); // hex crc32 of raw event data, parsed to decimal form

//     const message = `${transmissionId}|${timeStamp}|${WEBHOOK_ID}|${crc}`

//     console.log(`Original signed message ${message}`);

//     const certPem = await downloadAndCache(headers['paypal-cert-url']);

//     // Create buffer from base64-encoded signature
//     const signatureBuffer = Buffer.from(headers['paypal-transmission-sig'], 'base64');

//     // Create a verification object
//     const verifier = crypto.createVerify('SHA256');

//     // Add the original message to the verifier
//     verifier.update(message);

//     return verifier.verify(certPem, signatureBuffer);

//   }

const SAFE_MAP: Record<string, string> = {
    '/': '_s_',
    '?': '_q_',
    '&': '_a_',
    '=': '_e_',
    '#': '_h_',
    '%': '_p_',
    ':': '_c_',
};

export function safeEncode(input: string): string {
    return input.replace(/[/\?&#=%]/g, char => SAFE_MAP[char] || char);
}

export function safeDecode(input: string): string {
    let output = input;
    for (const [char, token] of Object.entries(SAFE_MAP)) {
        output = output.replaceAll(token, char);
    }
    return output;
}
