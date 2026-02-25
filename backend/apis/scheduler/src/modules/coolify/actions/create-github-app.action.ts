import { config } from '@/common/config';
import { fetchCoolify } from './fetch-coolify.util';

/**
 * Create a new private GitHub App Application Container
 */
export async function createGitHubApp(payload: any) {
    return await fetchCoolify('/applications/private-github-app', {
        method: 'POST',
        body: JSON.stringify({
            github_app_uuid: config.COOLIFY_GITHUB_APP_UUID,
            git_repository: config.COOLIFY_REPOSITORY,
            git_branch: config.COOLIFY_BRANCH,
            ports_exposes: '3000',
            build_pack: 'dockerfile',
            is_static: false,
            is_spa: false,
            base_directory: '/',
            dockerfile_location: '/runtime/worker/Dockerfile',
            watch_paths: 'runtime/worker/**',
            use_build_server: false,
            is_http_basic_auth_enabled: true,
            autogenerate_domain: false,
            ...payload,
        }),
    });
}
