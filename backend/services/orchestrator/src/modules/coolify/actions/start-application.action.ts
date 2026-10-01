import { fetchCoolify } from './fetch-coolify.util';

/**
 * Start an application container based on its UUID
 */
export async function startApplication(appUuid: string) {
    return await fetchCoolify(`/applications/${appUuid}/start`, {
        method: 'GET',
    });
}
