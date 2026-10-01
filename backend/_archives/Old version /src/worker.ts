import { workerData, parentPort } from "worker_threads";
import { randomUUID } from "crypto";

const TARGET_URL = "http://localhost:3003/v1/ingest/paypal/XZZKoMJjy";

const headers = {
  accept: "*/*",
  "accept-encoding": "gzip, deflate, br, zstd",
  "client-ip": "173.0.81.140:7197",
  connection: "keep-alive",
  "content-length": "772",
  "content-type": "application/json",
  "correlation-id": "45dfc9dd816d2",
  "disguised-host": "smee.io",
  host: "localhost:3003",
  "max-forwards": "10",
  "paypal-auth-algo": "SHA256withRSA",
  "paypal-auth-version": "v2",
  "paypal-cert-url": "https://api.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-b0d12406",
  "paypal-transmission-id": "b0259a53-a556-11f0-8e10-f3f4661040a7",
  "paypal-transmission-sig":
    "O7NUXvgDYN77W6e7stjswEGr0ePyBNLgR+5s1YZ20iKV+/PKc6pYXPiYzb16aenZFaL71zoeScUuYwoNe5UKTzWpunpHm0iN3EPfow7GXHYZxflfKSkTT1o9EvlezfKMjk/Db+XPmxC53lKNPUBDCAVFrmtiLL3v5pySEicuETIRKA6MmIP9DlQSGuC+C3Re4zu5kI5N0RGffMPFcqOflTulxxmIQHcWyACd6CbENpqA5qHQlOmZdhfVNVaZhCbcml+eP3pVhn3esJh8DRMgUPQ+kPUbTnvUZi1xFijdlPyeG6hZ5HW/QBLu7tgd1ny6xrLFFkS/Vhmqq9KUwoYxbw==",
  "paypal-transmission-time": "2025-10-09T21:26:58Z",
  timestamp: "1760045222369",
  "user-agent": "PayPal/AUHD-1.0-1",
  "x-client-ip": "173.0.81.140",
  "x-client-port": "7197",
  "x-forwarded-for": "173.0.81.140:7197",
};

const baseBody = {
  create_time: "2019-01-25T07:18:28.264Z",
  resource_type: "managed-accounts",
  event_type: "CUSTOMER.MANAGED-ACCOUNT.ACCOUNT-CREATED",
  summary: "A managed account was created.",
  resource: {
    account_id: "7G4EPEEPEF74L",
    external_id: "external_id_353535335",
    links: [
      {
        rel: "self",
        href: "https://api.paypal.com/v3/customer/managed-accounts/7G4EPEEPEF74L",
        method: "GET",
      },
    ],
  },
  links: [
    {
      href: "https://api.paypal.com/v1/notfications/webhooks-events",
      rel: "self",
      method: "GET",
      encType: "application/json",
    },
  ],
  event_version: "1.0",
  application_context: {
    event_context: "INFO",
  },
};

async function sendRequests(start: number, count: number) {
  for (let i = 0; i < count; i++) {
    const id = `WH-${randomUUID()}`;
    const body = JSON.stringify({ ...baseBody, id });

    try {
      const res = await fetch(TARGET_URL, {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) {
        
        console.log(JSON.stringify(await res.json()));
        parentPort?.postMessage(`❌ Request ${start + i} failed: ${res.status}`);
      } else {
        parentPort?.postMessage(`✅ Sent ${id}`);
      }
    } catch (err) {
      parentPort?.postMessage(`⚠️ Error on ${id}: ${err}`);
    }
  }
  parentPort?.postMessage(`🎯 Worker done (${count} requests)`);
}

sendRequests(workerData.start, workerData.count);
