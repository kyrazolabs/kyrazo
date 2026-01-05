import crypto from 'crypto';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();

const MASTER_SECRET = '8ab3edfadc23ba48a9382e4107f20e9e750762fa2211a6a720d3664805aa8221';

// التوقيع
export async function signCommand(
    payload: string,
    timestamp = Math.floor(Date.now() / 1000),
    nonce = crypto.randomBytes(8).toString('hex')
): Promise<{ signature: string; timestamp: number; nonce: string }> {
    console.log('Scheduler signing with secret:', MASTER_SECRET);
    console.log('Payload:', payload);
    console.log('Timestamp:', timestamp);
    console.log('Nonce:', nonce);
    const hmac = crypto.createHmac('sha512', MASTER_SECRET!);
    hmac.update(`${payload}.${timestamp}.${nonce}`);
    const signature = hmac.digest('base64');
    console.log('Generated signature:', signature);
    return { signature, timestamp, nonce };
}
