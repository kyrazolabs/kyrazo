import crypto from 'crypto';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();

const MASTER_SECRET = process.env.AGENT_MASTER_SECRET;
if (!MASTER_SECRET) throw new Error("Missing MASTER_SECRET env");

export function verifyCommand(
    payload: string,
    signature: string,
    timestamp: number,
    nonce: string,
    maxAgeMs = 5 * 60,
    nonceCache?: Set<string>
): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > maxAgeMs) return false;

    if (nonceCache && nonceCache.has(nonce)) return false;
    if (nonceCache) nonceCache.add(nonce);

    const hmac = crypto.createHmac('sha512', MASTER_SECRET!);
    hmac.update(`${payload}.${timestamp}.${nonce}`);
    const expectedSig = hmac.digest('base64');

    console.log('Payload:', payload);
    console.log('Timestamp:', timestamp);
    console.log('Nonce:', nonce);
    console.log('Expected:', expectedSig);
    console.log('Signature:', signature);

    return expectedSig.length === signature.length &&
        crypto.timingSafeEqual(
            Buffer.from(expectedSig, 'base64'),
            Buffer.from(signature, 'base64')
        );
}