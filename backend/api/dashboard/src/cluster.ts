#!/usr/bin/env bun

import cluster from "node:cluster";
import os from "node:os";
import { spawn } from "node:child_process";

const numCPUs = 2;
const MAX_RESTARTS = 100;

const restartCount: Record<number, number> = {};

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} starting ${numCPUs} workers...`);

    function spawnWorker(previousCount = 0) {
        const worker = cluster.fork();
        restartCount[worker.id] = previousCount;

        worker.on("exit", (code, signal) => {
            const count = restartCount[worker.id];

            if (code === 0) {
                console.log(
                    `Worker ${worker.process.pid} exited normally. Restarting immediately...`
                );

                // إعادة تشغيل بدون زيادة المحاولات
                setTimeout(() => {
                    spawnWorker(count);
                }, 1000);

                return;
            }

            const newCount = count + 1;
            restartCount[worker.id] = newCount;

            console.error(
                `Worker ${worker.process.pid} crashed (code: ${code}). Error restart ${newCount}/${MAX_RESTARTS}.`
            );

            if (newCount >= MAX_RESTARTS) {
                console.error(
                    `Worker ${worker.process.pid} reached max error retries. Not restarting anymore.`
                );
                return;
            }

            setTimeout(() => {
                spawnWorker(newCount);
            }, 3000);
        });
    }

    for (let i = 0; i < numCPUs; i++) {
        spawnWorker(0);
    }

} else {
    console.log(`Worker ${process.pid} started`);

    setTimeout(() => {
        const child = spawn("bun", ["run", "src/insert.js"], {
            stdio: "inherit",
            env: process.env,
        });
    
        child.on("exit", code => {
            process.exit(code ?? 1);
        });            
    }, 5000);
}
