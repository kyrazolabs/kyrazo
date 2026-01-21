export interface SupportTicket {
  subject: string;
  message: string;
  Types: SupportType;
  Category: SupportCategory;
}

export type SupportType =
  | "Bug"
  | "Feature request"
  | "Billing"
  | "Security"
  | "Abuse"
  | "Others";

export type SupportCategory =
  | "API"
  | "Webhook Delivery"
  | "Dashboard"
  | "SDKs"
  | "Ingest"
  | "Dispatch"
  | "Filters"
  | "Analytics"
  | "Sources"
  | "Connecters"
  | "Invoices"
  | "Refunds"
  | "Usage Limits"
  | string; // Flexible for 'Others' or future categories

export const SUPPORT_TYPES: SupportType[] = [
  "Bug",
  "Feature request",
  "Billing",
  "Security",
  "Abuse",
  "Others",
];

export const CATEGORIES_BY_TYPE: Record<SupportType, string[]> = {
  Bug: ["API", "Webhook Delivery", "Dashboard", "SDKs"],
  "Feature request": [
    "Ingest",
    "Dispatch",
    "Filters",
    "Analytics",
    "Sources",
    "Connecters",
  ],
  Billing: ["Invoices", "Refunds", "Usage Limits"],
  Security: [],
  Abuse: [],
  Others: [],
};
