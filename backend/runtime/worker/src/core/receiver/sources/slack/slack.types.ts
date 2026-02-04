export interface SlackEventPayload {
    token?: string;
    team_id?: string;
    api_app_id?: string;
    event?: {
        type: string;
        event_ts: string;
        user?: string;
        item?: any;
        [key: string]: any;
    };
    type: string;
    event_id: string;
    event_time: number;
    challenge?: string;
    [key: string]: any;
}

export interface ISlackHeaders {
    'x-slack-signature': string;
    'x-slack-request-timestamp': string;
}
