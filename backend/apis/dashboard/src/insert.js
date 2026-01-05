import { createClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';

// إعداد اتصال createClient
const client = new createClient({
    url: 'http://192.168.8.2:8123',
    username: 'default',
    password: '',
    database: 'default',
});

// إعداد المتغيرات
const workspace_id = '691dcf1802c3f617841947bc';
const project_id = '691f76064199590ef58a7937';
const producer_id = 'demo_producer';
const source_type = 'demo_source';
const source_id = '692c6dfb4b46c09153601215';
const event_id = randomUUID();
const targetsCount = 10;


// دالة لتوليد رقم عشوائي بين min و max
const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(randomBetween(min, max));
const formatDate = (dt) => dt.toISOString().replace('T', ' ').replace('Z', '');

function randomEventType() {
  const types = [
    "user.create",
    "user.update",
    "user.delete",
    "invoice.paid",
    "invoice.failed",
    "order.created",
    "order.refunded",
    "subscription.started",
    "subscription.ended",
    "auth.login",
    "auth.logout",
    "product.created",
    "product.deleted",
    "cart.updated",
    "payment.started",
    "payment.canceled"
  ];
  return types[Math.floor(Math.random() * types.length)];
}
function randomDate() {
  const start = new Date("2025-10-30");
  const end = new Date("2025-11-28");

  // فرق الأيام
  const daysRange = (end - start) / (1000 * 60 * 60 * 24);

  // اختيار يوم عشوائي
  const randomDay = Math.floor(Math.random() * daysRange);

  // إنشاء التاريخ مع اليوم العشوائي
  const dt = new Date(start);
  dt.setDate(start.getDate() + randomDay);

  // إضافة وقت عشوائي (ساعة/دقيقة/ثانية)
  dt.setHours(Math.floor(Math.random() * 24));
  dt.setMinutes(Math.floor(Math.random() * 60));
  dt.setSeconds(Math.floor(Math.random() * 60));
  dt.setMilliseconds(Math.floor(Math.random() * 1000));

  return dt;
}


/* ----------------------------
   Complex Request Header
----------------------------- */
function generateRequestHeaders() {
  return JSON.stringify({
    "content-type": "application/json",
    "user-agent": `Hookify-Runtime/${randomBetween(1, 5).toFixed(1)}`,
    "x-request-id": randomUUID(),
    "x-real-ip": `192.168.${randomInt(1,254)}.${randomInt(1,254)}`,
    "accept": "*/*",
    "authorization": `Bearer demo_${randomUUID().slice(0, 12)}`
  });
}


/* ----------------------------
   Complex Response Header
----------------------------- */
function generateResponseHeaders() {
  return JSON.stringify({
    "server": "nginx",
    "content-type": "application/json",
    "cache-control": "no-cache",
    "x-response-id": randomUUID(),
    "x-runtime-ms": randomInt(10, 300),
  });
}

/* ----------------------------
   Rich Request Bodies
----------------------------- */
function generateRequestBody(event) {
  switch (event) {
    case "user.create":
      return JSON.stringify({
        id: randomUUID(),
        email: `user${randomInt(1,9999)}@example.com`,
        name: "Test User",
        created_at: new Date().toISOString(),
        metadata: {
          ref_id: randomUUID(),
          flags: ["new", "beta"],
        }
      });

    case "order.created":
      return JSON.stringify({
        order_id: randomUUID(),
        amount: randomBetween(20, 900).toFixed(2),
        currency: "USD",
        items: [
          { sku: "SKU-001", qty: randomInt(1, 5) },
          { sku: "SKU-002", qty: randomInt(1, 3) }
        ],
        customer: randomUUID(),
      });

    case "invoice.paid":
      return JSON.stringify({
        invoice_id: randomUUID(),
        amount: randomBetween(50, 200).toFixed(2),
        paid_at: new Date().toISOString(),
        status: "paid"
      });

    default:
      return JSON.stringify({
        event,
        tag: randomUUID(),
        timestamp: new Date().toISOString()
      });
  }
}


/* ----------------------------
   Rich Response Bodies
----------------------------- */
function generateResponseBody(success, event) {
  if (success) {
    return JSON.stringify({
      success: true,
      received: true,
      event_type: event,
      processed_at: new Date().toISOString()
    });
  }

  return JSON.stringify({
    success: false,
    error: "Processing failed",
    retry_after: randomInt(1, 60),
    debug_id: randomUUID()
  });
}


// توليد البيانات
const rows = [];

for (let i = 0; i < targetsCount; i++) {
    const target = `target_${i + 1}.example.com`;
    const deliveryAttempts = Math.floor(randomBetween(1, 5));
    const successRate = randomBetween(70.568, 99.999);
    const event_type = randomEventType();

    
    for (let attempt = 1; attempt <= deliveryAttempts; attempt++) {
        const isSuccess = Math.random() * 100 <= successRate;
        
        const request_header = generateRequestHeaders();
        const response_header = generateResponseHeaders();
        const request_body = generateRequestBody(event_type);
        const response_body = generateResponseBody(isSuccess, event_type);
        const date = randomDate()
        rows.push({
            delivery_id: randomUUID(),
            workspace_id,
            project_id,
            producer_id,
            source_type,
            event_type,
            event_id,
            event_model: 1, // PublishedEvent
            source_id,
            endpoint_id: null,
            target,
            status: isSuccess ? 'delivered' : 'failed',
            attempt_number: attempt,
            request_header,
            request_body,
            response_code: isSuccess ? 200 : 500,
            response_header,
            response_body,
            response_time_ms: Math.floor(randomBetween(50, 2000)),
            scheduled_at: formatDate(new Date(date)),
            processed_at: formatDate(new Date(date)),
            error: isSuccess ? null : 'Random error',
        });
    }
}

// إدخال البيانات دفعة واحدة
async function insertData() {
    try {
        // ClickHouse يدعم JSONEachRow
        await client.insert({
            table: 'delivery_attempts',
            values: rows,
            format: 'JSONEachRow'
        });
        console.log('Inserted all demo delivery attempts successfully!');
    } catch (err) {
        console.error(err);
    }
}











insertData();
