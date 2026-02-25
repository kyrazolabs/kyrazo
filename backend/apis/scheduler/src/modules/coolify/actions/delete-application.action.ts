import { fetchCoolify } from './fetch-coolify.util';

/**
 * Delete an application (and its container) entirely
 */
export async function deleteApplication(appUuid: string) {
    return await fetchCoolify(`/applications/${appUuid}`, {
        method: 'DELETE',
    });
}
