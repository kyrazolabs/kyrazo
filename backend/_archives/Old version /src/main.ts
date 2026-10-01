import { Worker } from "worker_threads";

const TOTAL_REQUESTS = 1;
const WORKER_COUNT = 1; // عدد الـ Workers
const REQUESTS_PER_WORKER = TOTAL_REQUESTS / WORKER_COUNT;

console.log(`🚀 Starting ${WORKER_COUNT} workers (${REQUESTS_PER_WORKER} requests each)`);

for (let i = 0; i < WORKER_COUNT; i++) {
  const startTime = Date.now(); // وقت البداية

  const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
    workerData: { start: i * REQUESTS_PER_WORKER, count: REQUESTS_PER_WORKER },
  });

  worker.on("message", (msg) => console.log(`🧩 Worker ${i}:`, msg));
  worker.on("error", (err) => console.error(`❌ Worker ${i} error:`, err));
  worker.on("exit", (code) => {
    const endTime = Date.now(); // وقت النهاية
    const duration = ((endTime - startTime) / 1000).toFixed(2); // بالثواني
    console.log(`✅ Worker ${i} finished (code ${code}) in ${duration} seconds`);
  });
}
