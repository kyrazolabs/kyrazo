export type SupportTicket =
    | {
          Types: Exclude<SupportType, UncategorizedType>;
          Category: CategoryByType[Exclude<SupportType, UncategorizedType>];
          subject: string;
          message: string;
          kind?: 'support' | 'cancellation';
      }
    | {
          Types: UncategorizedType;
          Category?: never;
          subject: string;
          message: string;
          kind?: 'support' | 'cancellation';
      };

export type SupportType =
    | 'Bug'
    | 'Feature request'
    | 'Billing'
    | 'Security'
    | 'Abuse'
    | 'Others';

export type BugCategory = 'API' | 'Webhook Delivery' | 'Dashboard' | 'SDKs';
export type FeatureCategory =
    | 'Ingest'
    | 'Dispatch'
    | 'Filters'
    | 'Analytics'
    | 'Sources'
    | 'Connectors';
export type BillingCategory =
    | 'Invoices'
    | 'Refunds'
    | 'Usage Limits'
    | 'Cancellation';

// Types with no sub-categories
export type UncategorizedType = 'Security' | 'Abuse' | 'Others';

export const SUPPORT_TYPES: SupportType[] = [
    'Bug',
    'Feature request',
    'Billing',
    'Security',
    'Abuse',
    'Others',
];

export type CategoryByType = {
    Bug: BugCategory;
    'Feature request': FeatureCategory;
    Billing: BillingCategory;
    Security: null;
    Abuse: null;
    Others: null;
};

export const CATEGORIES_BY_TYPE: Record<SupportType, readonly string[]> = {
    Bug: ['API', 'Webhook Delivery', 'Dashboard', 'SDKs'],
    'Feature request': [
        'Ingest',
        'Dispatch',
        'Filters',
        'Analytics',
        'Sources',
        'Connectors',
    ],
    Billing: ['Invoices', 'Refunds', 'Usage Limits', 'Cancellation'],
    Security: [],
    Abuse: [],
    Others: [],
} as const;
