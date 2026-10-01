import { OAuth2Client, TokenPayload } from 'google-auth-library';

class GoogleAuthConfig {
    private static instance: OAuth2Client | null = null;

    private constructor() {}

    private static createClient(): OAuth2Client {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId) {
            throw new Error('GOOGLE_CLIENT_ID is not defined');
        }

        // Secret exists → OAuth Code Flow supported
        if (clientSecret) {
            return new OAuth2Client(clientId, clientSecret, 'postmessage');
        }

        // No secret → ID Token verification only
        return new OAuth2Client(clientId);
    }

    public static getClient(): OAuth2Client {
        if (!this.instance) {
            this.instance = this.createClient();
        }
        return this.instance;
    }

    /* -------------------------------------------
     ID TOKEN FLOW (One-Tap / Popup)
  --------------------------------------------*/
    public static async verifyIdToken(idToken: string): Promise<TokenPayload> {
        const client = this.getClient();

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Invalid Google ID token');
        }

        return payload;
    }

    /* -------------------------------------------
     AUTH CODE FLOW (Always shows login page)
  --------------------------------------------*/
    public static async exchangeCode(code: string): Promise<TokenPayload> {
        const client = this.getClient();

        if (!process.env.GOOGLE_CLIENT_SECRET) {
            throw new Error('GOOGLE_CLIENT_SECRET required for code exchange');
        }

        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        if (!tokens.id_token) {
            throw new Error('Missing id_token from Google');
        }

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Invalid Google auth code');
        }

        return payload;
    }
}

export default GoogleAuthConfig;
