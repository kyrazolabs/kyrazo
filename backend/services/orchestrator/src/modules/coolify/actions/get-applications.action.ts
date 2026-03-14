import { fetchCoolify } from './fetch-coolify.util';

/**
 * Fetch all deployed applications
 */
export async function getApplications() {
    return await fetchCoolify('/applications', {
        method: 'GET',
    });
}
