#!/usr/bin/env bun

import cluster from "node:cluster";
import os from "node:os";
import { spawn } from "node:child_process";

const numCPUs = Number(process.env.WORKERS) || os.cpus().length;
const workers: Record<number, any> = {};

if (cluster.isPrimary) {
  console.info(`🚀 Master process PID ${process.pid} starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers[worker.id] = worker;

    worker.on("exit", (code, signal) => {
      console.error(`❌ Worker ${worker.process.pid} exited (code: ${code}, signal: ${signal}). Restarting...`);
      const newWorker = cluster.fork();
      workers[newWorker.id] = newWorker;
    });
  }

  process.on("SIGINT", () => {
    console.info("\n🛑 SIGINT received, shutting down all workers...");
    for (const id in workers) {
      workers[id].kill("SIGTERM");
    }
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.info("\n🛑 SIGTERM received, shutting down all workers...");
    for (const id in workers) {
      workers[id].kill("SIGTERM");
    }
    process.exit(0);
  });

} else {
  console.info(`👷 Worker ${process.pid} started`);
  const workerProcess = spawn("bun", ["run", "src/index.ts"], {
    stdio: "inherit",
    env: process.env,
  });

  workerProcess.on("exit", (code) => {
    console.error(`Worker ${process.pid} internal process exited with code ${code}`);
    process.exit(code ?? 1);
  });
}
