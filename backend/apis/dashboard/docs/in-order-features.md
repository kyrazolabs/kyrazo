# **Feature Request: Outbound Webhook With Custom HTTP Methods**

## **Problem Statement**

Current outbound webhook system only supports a fixed HTTP method (typically POST). This limits integration workflows where partner systems expect different HTTP verbs to represent different actions. Customers need more control over how events are delivered to their endpoints to enable better automation and semantic behavior.

## **Goal**

Allow each webhook subscription (or outbound event rule) to define the **HTTP method** used when sending the request to the target endpoint.

Supported methods: **POST, PUT, PATCH, DELETE**.

This provides a flexible workflow where event types map cleanly to REST actions.

---

## **Proposed Solution**

Enhance the webhook/event dispatcher so each outbound rule includes:

1. **Endpoint URL**
2. **HTTP Method** (POST, PUT, PATCH, DELETE)
3. **Custom JSON Body (optional)**
4. **Dynamic variables** (e.g., `{{id}}`, `{{user.email}}`)
5. **Headers (optional)**

When an event is validated and triggered, the dispatcher will send a request using the defined HTTP method and JSON payload.

---

## **Use Cases**

### 1. **Automatic Delete Action**

If a resource is deleted in the customer’s app, the system automatically sends:

```
DELETE https://example.com/post/:id
```

Dynamic parameters:

* `:id` replaced by the event payload.

### 2. **Update Resource on Customer System**

On a user update event:

```
PUT https://example.com/users/{{id}}
Body:
{
  "name": "{{name}}",
  "email": "{{email}}"
}
```

### 3. **Partial Update**

On status changes:

```
PATCH https://example.com/order/{{orderId}}
Body:
{
  "status": "{{status}}"
}
```

### 4. **Standard Create Event**

Trigger a custom POST with structured JSON:

```
POST https://example.com/webhooks/create-article
Body:
{
  "title": "{{title}}",
  "author": "{{author}}",
  "published_at": "{{createdAt}}"
}
```

---

## **Technical Requirements**

### **1. Dispatcher Enhancements**

* Accept configurable HTTP methods per subscription.
* Validate endpoint method is allowed.
* Validate custom body template.
* Replace template variables at runtime.

### **2. Payload Engine**

* Support JSON templating.
* Sanitize placeholders.
* Reject malformed JSON templates.

### **3. Error Handling & Retries**

* Use existing Retry Queue.
* Treat failures independently of method used.
* Log full request (excluding sensitive data).

### **4. Security**

* Respect user-level secrets (HMAC, headers).
* Enforce HTTPS-only endpoints.
* Rate limit malicious or failing endpoints.

---

## **API Representation (Example)**

### **Subscription Config**

```json
{
  "endpoint": "https://example.com/post/{{id}}",
  "method": "DELETE",
  "headers": {
    "Authorization": "Bearer {{token}}",
    "Content-Type": "application/json"
  },
  "body": null
}
```

Another example with body:

```json
{
  "endpoint": "https://example.com/item/{{itemId}}",
  "method": "PATCH",
  "body": {
    "quantity": "{{qty}}",
    "status": "{{status}}"
  }
}
```

---

## **Expected Impact**

* Better workflow automation.
* Stronger REST/CRUD mapping between events and customer systems.
* More flexible integrations without requiring middleware.
* Competitive parity with platforms like Stripe, Svix, Clerk, and Segment.

---

If you want, I can also produce:

* API schema (OpenAPI)
* UI wireframe for selecting method + body
* Database model changes
* Event dispatch flow diagram
