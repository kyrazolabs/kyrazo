import { spawn } from 'bun';

// --- Helpers --------------------------------------------------------------

function startProcess(cmd: string[], name: string) {
    console.log(`Starting ${name}...`);

    return spawn({
        cmd,
        stdout: 'inherit',
        stderr: 'inherit',
    });
}

function runSmee() {
    return startProcess(
        [
            'bun',
            'run',
            '--silent',
            '-e',
            `
import SmeeClient from 'smee-client';

const smee = new SmeeClient({
    source: 'https://smee.io/LunAlkvkr8pzUaiK',
    target: 'http://localhost:3003/v1/payments/source',
    logger: console,
});
smee.start();
            `,
        ],
        'Smee'
    );
}

function runTunnel() {
    return startProcess(
        [
            'ssh',
            '-i',
            `${process.env.HOME}/.ssh/localhostrun_ed25519`,
            '-R',
            '80:localhost:3003',
            'ssh.localhost.run',
        ],
        'SSH Tunnel'
    );
}

// --- Interactive Prompt (only if no args provided) ------------------------

async function prompt(question: string): Promise<string> {
    process.stdout.write(question);
    return new Promise(resolve => {
        process.stdin.resume();
        process.stdin.once('data', data => resolve(data.toString().trim()));
    });
}

// --- Main Logic -----------------------------------------------------------

async function main() {
    const arg = process.argv[2];

    if (arg === 'smee') return runSmee();
    if (arg === 'tunnel') return runTunnel();

    console.log('Choose an option:');
    console.log('1) Start Smee');
    console.log('2) Start SSH Tunnel');
    console.log('3) Exit');

    const answer = await prompt('> ');

    switch (answer) {
        case '1':
            return runSmee();
        case '2':
            return runTunnel();
        default:
            console.log('Goodbye.');
            process.exit(0);
    }
}

main();
