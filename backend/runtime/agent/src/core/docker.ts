import type { StartWorkerPayload } from '@kyrazo/shared';

export class DockerManager {
    static async startContainer(payload: StartWorkerPayload) {
        const { workerId, image, env, resources } = payload;
        const containerName = `worker-${workerId}`;
        const dockerImage = 'worker'; // Default image

        console.log(`🐳 Starting container ${containerName}...`);

        // Prepare Env Args
        const envArgs = Object.entries(env).flatMap(([k, v]) => [
            '-e',
            `${k}=${v}`,
        ]);

        // Clean up old container if exists
        await DockerManager.stopContainer(workerId, true);

        const cmd = [
            'docker',
            'run',
            '-d',
            '--name',
            containerName,
            '--cpus',
            '1',
            '--memory',
            '2g',
            '--env-file',
            '.env.prod',
            ...envArgs,
            dockerImage,
        ];

        console.log('Running:', cmd.join(' '));

        const proc = Bun.spawn(cmd, {
            stdout: 'pipe',
            stderr: 'pipe',
        });

        const exitCode = await proc.exited;
        if (exitCode !== 0) {
            const stderr = await new Response(proc.stderr).text();
            console.error(
                `❌ Docker Start Error for ${containerName}:`,
                stderr
            );
            throw new Error(`Failed to start docker container: ${stderr}`);
        }

        console.log(`✅ Container ${containerName} started.`);
    }

    static async stopContainer(workerId: string, force = false) {
        const containerName = `worker-${workerId}`;
        // console.log(`🛑 Ensuring cleanup for ${containerName}...`);

        try {
            // Stop
            await Bun.spawn(['docker', 'stop', containerName], {
                stderr: 'pipe',
                stdout: 'pipe',
            }).exited;

            // Remove
            await Bun.spawn(['docker', 'rm', containerName], {
                stderr: 'pipe',
                stdout: 'pipe',
            }).exited;
        } catch (err) {
            console.warn(
                `Failed to cleanup container ${containerName}, might already be gone.`
            );
        }
    }

    static async checkHealth() {
        // Simple check if docker is running
        const proc = Bun.spawn(['docker', 'info'], {
            stdout: 'ignore',
            stderr: 'ignore',
        });
        const exitCode = await proc.exited;
        if (exitCode !== 0) throw new Error('Docker daemon is not running');
    }

    static async getRunningContainers(): Promise<string[]> {
        const proc = Bun.spawn(['docker', 'ps', '--format', '{{.Names}}'], {
            stdout: 'pipe',
            stderr: 'pipe',
        });

        const output = await new Response(proc.stdout).text();
        const containers = output.trim().split('\n');

        return containers
            .filter(name => name.startsWith('worker-'))
            .map(name => name.replace('worker-', ''));
    }
}
