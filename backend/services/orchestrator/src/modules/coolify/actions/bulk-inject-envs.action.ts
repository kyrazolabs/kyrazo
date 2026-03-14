import { fetchCoolify } from './fetch-coolify.util';

/**
 * Bulk inject environment variables into a Coolify application
 */
export async function bulkInjectEnvs(
    appUuid: string,
    envs: { key: string; value: string; is_preview?: boolean }[]
) {
    const data = envs.map(env => ({
        key: env.key,
        value: env.value,
        is_preview: env.is_preview !== undefined ? env.is_preview : false,
        is_literal: false,
        is_multiline: false,
        is_shown_once: false,
    }));

    return await fetchCoolify(`/applications/${appUuid}/envs/bulk`, {
        method: 'PATCH',
        body: JSON.stringify({ data }),
    });
}
