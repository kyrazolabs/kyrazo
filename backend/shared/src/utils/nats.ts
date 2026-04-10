/**
 * @title NATS Subject Utilities
 * @description Centralized logic for generating deterministic NATS subjects and durable names.
 */

/**
 * Generates a deterministic subject for Kyrazo events.
 * Format: workspace.<ID>.plan.<PLAN>.events.<CATEGORY>.<DETAIL>
 */
export function getNatsSubject(
    workspaceId: string,
    planSlug: string,
    category: 'publish' | 'receive',
    detail: string
): string {
    const sanitizedWorkspaceId = workspaceId.replace(/\./g, '_');
    const sanitizedPlan = planSlug.toLowerCase().replace(/\./g, '_');
    const sanitizedDetail = detail.toLowerCase().replace(/\./g, '_');

    return `workspace.${sanitizedWorkspaceId}.plan.${sanitizedPlan}.events.${category}.${sanitizedDetail}`;
}

/**
 * Generates a deterministic durable name for NATS consumers.
 * Format: worker_w_<ID>_p_<PLAN>
 */
export function getNatsDurableName(workspaceId: string, planSlug: string): string {
    const sanitizedWorkspaceId = workspaceId.replace(/\./g, '_');
    const sanitizedPlan = planSlug.toLowerCase().replace(/\./g, '_');

    return `worker_w_${sanitizedWorkspaceId}_p_${sanitizedPlan}`;
}
