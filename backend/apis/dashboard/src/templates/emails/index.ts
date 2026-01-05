import * as fs from 'fs';
import * as path from 'path';

/**
 * @title Email Templates
 * @description Collection of email templates with rendering functionality
 */

export interface EmailTemplateData {
    // Common fields
    brandName?: string;
    baseUrl?: string;
    supportEmail?: string;
    firstName?: string;
    lastName?: string;
    email?: string;

    // Welcome email
    // (uses common fields)

    // Password reset
    resetUrl?: string;

    // Email verification
    verificationUrl?: string;

    // Workspace invitation
    workspaceName?: string;
    inviterName?: string;
    inviterEmail?: string;
    invitationUrl?: string;
    role?: string;
    expiresAt?: string;

    // Source failure
    sourceName?: string;
    sourceUrl?: string;
    statusCode?: string | number;
    timestamp?: string;
    attemptNumber?: number;
    maxAttempts?: number;
    errorMessage?: string;
    responseBody?: string;
    sourceDetailsUrl?: string;
    retryUrl?: string;
    logsUrl?: string;
    settingsUrl?: string;

    // Daily summary
    date?: string;
    totalDeliveries?: number;
    successfulDeliveries?: number;
    failedDeliveries?: number;
    successRate?: number;
    successRateClass?: string;
    averageResponseTime?: number;
    mostActiveSource?: string;
    peakHour?: string;
    totalDataTransferred?: string;
    dashboardUrl?: string;
    topFailures?: Array<{
        sourceName: string;
        failureCount: number;
    }>;
}

/**
 * @title Load Email Template
 * @description Loads and renders an email template with provided data
 * @param templateName - Name of the template file (without .html extension)
 * @param data - Data to replace in the template
 * @returns Rendered HTML string
 */
export function loadEmailTemplate(
    templateName: string,
    data: EmailTemplateData = {}
): string {
    try {
        const templatePath = path.join(__dirname, `${templateName}.html`);
        let template = fs.readFileSync(templatePath, 'utf-8');

        // Replace template variables
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                template = template.replace(regex, String(value));
            }
        });

        // Remove any remaining template variables
        template = template.replace(/{{[^}]+}}/g, '');

        return template;
    } catch (error) {
        throw new Error(
            `Failed to load email template '${templateName}': ${error}`
        );
    }
}

/**
 * @title Available Email Templates
 * @description List of available email template names
 */
export const EMAIL_TEMPLATES = {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password-reset',
    EMAIL_VERIFICATION: 'email-verification',
    WORKSPACE_INVITATION: 'workspace-invitation',
    WEBHOOK_FAILURE: 'source-failure',
    DAILY_SUMMARY: 'daily-summary',
} as const;

export type EmailTemplateType =
    (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];

/**
 * @title Render Welcome Email
 * @description Renders the welcome email template
 */
export function renderWelcomeEmail(
    data: Pick<
        EmailTemplateData,
        'firstName' | 'email' | 'brandName' | 'baseUrl' | 'supportEmail'
    >
): string {
    return loadEmailTemplate(EMAIL_TEMPLATES.WELCOME, data);
}

/**
 * @title Render Password Reset Email
 * @description Renders the password reset email template
 */
export function renderPasswordResetEmail(
    data: Pick<
        EmailTemplateData,
        'firstName' | 'email' | 'resetUrl' | 'brandName' | 'supportEmail'
    >
): string {
    return loadEmailTemplate(EMAIL_TEMPLATES.PASSWORD_RESET, data);
}

/**
 * @title Render Email Verification Email
 * @description Renders the email verification template
 */
export function renderEmailVerificationEmail(
    data: Pick<
        EmailTemplateData,
        'firstName' | 'email' | 'verificationUrl' | 'brandName' | 'supportEmail'
    >
): string {
    return loadEmailTemplate(EMAIL_TEMPLATES.EMAIL_VERIFICATION, data);
}

/**
 * @title Render Source Failure Email
 * @description Renders the source failure notification template
 */
export function renderSourceFailureEmail(
    data: Pick<
        EmailTemplateData,
        | 'firstName'
        | 'email'
        | 'sourceName'
        | 'sourceUrl'
        | 'statusCode'
        | 'timestamp'
        | 'attemptNumber'
        | 'maxAttempts'
        | 'errorMessage'
        | 'responseBody'
        | 'sourceDetailsUrl'
        | 'retryUrl'
        | 'logsUrl'
        | 'settingsUrl'
        | 'brandName'
        | 'supportEmail'
    >
): string {
    return loadEmailTemplate(EMAIL_TEMPLATES.WEBHOOK_FAILURE, data);
}

/**
 * @title Render Daily Summary Email
 * @description Renders the daily summary email template
 */
export function renderDailySummaryEmail(
    data: Pick<
        EmailTemplateData,
        | 'firstName'
        | 'email'
        | 'date'
        | 'totalDeliveries'
        | 'successfulDeliveries'
        | 'failedDeliveries'
        | 'successRate'
        | 'successRateClass'
        | 'averageResponseTime'
        | 'mostActiveSource'
        | 'peakHour'
        | 'totalDataTransferred'
        | 'dashboardUrl'
        | 'settingsUrl'
        | 'topFailures'
        | 'brandName'
    >
): string {
    return loadEmailTemplate(EMAIL_TEMPLATES.DAILY_SUMMARY, data);
}

/**
 * @title Render Workspace Invitation Email
 * @description Renders the workspace invitation email template
 */
export function renderWorkspaceInvitationEmail(
    data: Pick<
        EmailTemplateData,
        | 'firstName'
        | 'email'
        | 'workspaceName'
        | 'inviterName'
        | 'inviterEmail'
        | 'invitationUrl'
        | 'role'
        | 'expiresAt'
        | 'brandName'
        | 'supportEmail'
    >
): string {
    return loadEmailTemplate(EMAIL_TEMPLATES.WORKSPACE_INVITATION, data);
}

export default {
    loadEmailTemplate,
    renderWelcomeEmail,
    renderPasswordResetEmail,
    renderEmailVerificationEmail,
    renderWorkspaceInvitationEmail,
    renderSourceFailureEmail,
    renderDailySummaryEmail,
    EMAIL_TEMPLATES,
};
