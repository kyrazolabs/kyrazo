import { fetchCoolify } from './fetch-coolify.util';

/**
 * Fetch deployments for a specific application
 */
export async function getDeployments(appUuid: string) {
    return await fetchCoolify(`/deployments/applications/${appUuid}`, {
        method: 'GET',
    });
}
