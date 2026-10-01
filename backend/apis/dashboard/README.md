## شكل طلب JSON لإنشاء حدث Webhook (لإرساله إلى عدة Endpoints)

كما ذكرت سابقًا، الفكرة ليست في إرسال طلب واحد يحتوي على عدة `endpoints` مباشرة. بدلاً من ذلك، نظامك مصمم بحيث تقوم بتعريف `webhooks` منفصلة (كل منها يشير إلى `endpoint` واحد)، ثم تقوم بربط هذه الـ `webhooks` بأنواع أحداث معينة عبر `webhook_event_subscriptions`.

عندما تريد أن

يتم إرسال حدث معين، فإنك ترسل طلبًا إلى **نظامك الداخلي** (وليس مباشرة إلى الـ `endpoints` الخارجية) يخبره بأن هذا الحدث قد وقع، وما هي بياناته. بعد ذلك، يقوم نظامك بمعالجة هذا الطلب وتحديد الـ `webhooks` التي يجب تشغيلها.

### 1. تعريف الـ Webhooks والاشتراكات (خطوة الإعداد المسبق)

قبل أن تتمكن من إرسال حدث واحد إلى عدة `endpoints`، يجب أن تكون قد قمت بإعداد الـ `webhooks` والاشتراكات الخاصة بها في قاعدة بياناتك (OLTP).

**مثال:**

لنفترض أن لديك 3 `endpoints` مختلفة تريد إرسال نفس الحدث إليها:

- `endpoint_A`: `https://example.com/api/webhook/a`
- `endpoint_B`: `https://another.com/webhook/b`
- `endpoint_C`: `https://third.net/data/receive`

ستقوم بإنشاء 3 `webhooks` في نظامك (في جدول `webhooks` في MongoDB):

1.  **Webhook 1:** `url: https://example.com/api/webhook/a`, `user_id: user123`, `name:

Webhook for Service A`2.  **Webhook 2:**`url: https://another.com/webhook/b`, `user_id: user123`, `name: Webhook for Service B` 3. **Webhook 3:** `url: https://third.net/data/receive`, `user_id: user123`, `name: Webhook for Service C`

ثم، ستقوم بربط كل من هذه الـ `webhooks` بنوع الحدث الذي تهتم به (مثلاً، `user.created`) عبر جدول `webhook_event_subscriptions`.

### 2. شكل طلب JSON لتشغيل حدث (إلى نظامك الداخلي)

عندما يحدث شيء في نظامك وتريد أن يتم إرسال `webhooks` المتعلقة به، فإنك سترسل طلبًا إلى نقطة نهاية مخصصة في الـ API الخاص بك (وليس إلى الـ `endpoints` الخارجية مباشرة). هذا الطلب سيحتوي على `event_type` (نوع الحدث الذي وقع) و `payload` (البيانات المتعلقة بهذا الحدث).

لنفترض أن لديك نقطة نهاية في الـ API الخاص بك مثل `/api/v1/events/trigger`.

**مثال على طلب JSON لإرساله إلى `/api/v1/events/trigger`:**

```json
{
    "event_type": "user.created",
    "payload": {
        "user_id": "usr_abc123def456",
        "email": "john.doe@example.com",
        "name": "John Doe",
        "created_at": "2025-08-31T10:00:00Z",
        "metadata": {
            "source": "signup_form",
            "ip_address": "192.168.1.1"
        }
    },
    "metadata": {
        "trace_id": "trace_xyz789",
        "triggered_by": "system"
    }
}
```

**شرح الحقول:**

- `event_type` (مطلوب): سلسلة نصية تحدد نوع الحدث الذي وقع. يجب أن يتطابق هذا مع `name` في جدول `event_types` الخاص بك (مثلاً، `user.created`, `order.completed`, `payment.failed`).
- `payload` (مطلوب): كائن JSON يحتوي على البيانات الفعلية للحدث. هذا هو المحتوى الذي سيتم إرساله إلى الـ `endpoints` المستهدفة عبر الـ `webhooks`.
- `metadata` (اختياري): كائن JSON يمكن أن يحتوي على بيانات إضافية حول تشغيل الحدث نفسه، والتي قد تكون مفيدة للتتبع أو التصحيح داخل نظامك، ولكنها قد لا تكون جزءًا من الـ `payload` المرسل إلى الـ `webhooks` الخارجية.

### 3. كيف يتعامل نظامك مع هذا الطلب

عندما يتلقى الـ API الخاص بك هذا الطلب:

1.  يستقبل الطلب على `/api/v1/events/trigger`.
2.  يحدد `event_type` (مثلاً `user.created`).
3.  يستعلم من قاعدة بيانات OLTP (MongoDB) عن جميع الـ `webhook_event_subscriptions` المرتبطة بهذا `event_type`.
4.  لكل اشتراك مطابق، يسترد تفاصيل الـ `webhook` المرتبط به (من جدول `webhooks` في MongoDB).
5.  يقوم بإنشاء مهمة (job) في BullMQ لكل `webhook` يجب تشغيله. كل مهمة ستحتوي على:
    - `webhook_id` (معرف الـ webhook الذي سيتم تشغيله).
    - `event_type`.
    - `payload` (البيانات الفعلية للحدث).
    - أي بيانات تكوين إضافية للـ webhook (مثل `url`, `headers`, `secret_key`, `max_retries`) التي يحتاجها الـ worker لإرسال الـ webhook.
6.  يقوم الـ workers بسحب هذه المهام من BullMQ ومعالجتها، وإرسال الـ `payload` إلى الـ `url` الخاص بكل `webhook` بشكل منفصل.
7.  يتم تسجيل كل محاولة تسليم في ClickHouse (جدول `webhook_deliveries`).

بهذه الطريقة، يمكنك إرسال حدث واحد إلى نظامك، ويقوم النظام تلقائيًا بتحديد وإرسال الـ `payload` إلى جميع الـ `endpoints` التي تم تكوينها للاستماع إلى هذا النوع من الأحداث، دون الحاجة إلى تحديد الـ `endpoints` يدويًا في كل طلب تشغيل حدث.
