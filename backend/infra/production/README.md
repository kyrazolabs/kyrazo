# NATS Cluster TLS Setup (mTLS)

هذا الدليل يوضح كيفية إعداد **NATS Cluster** باستخدام شهادات صحيحة مع **mTLS**.

> الخطأ الشائع عند استخدام mkcert:
>
> ```
> x509: certificate specifies an incompatible key usage
> ```
>
> هذا ليس خطأ إعداد NATS، بل بسبب نوع الشهادة نفسها. شهادات mkcert صالحة فقط للمتصفحات وليست صالحة لـ Server-to-Server mTLS مثل NATS، gRPC، أو Database TLS.

---

## 1️⃣ لماذا mkcert لا يصلح

- مخصص لـ **HTTPS / Browsers** فقط
- لا يضع KeyUsage و ExtendedKeyUsage المناسبة لـ NATS Routes
- Go TLS يرفض استخدامها في Cluster/Routes

**الحل:** استخدم **OpenSSL**, **cfssl** أو **step-ca**. هنا نستخدم OpenSSL.

---

## 2️⃣ إنشاء CA (مرة واحدة)

```bash
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key \
  -sha256 -days 3650 \
  -subj "/CN=NATS-CA" \
  -out ca.pem
```

> **ca.key** يُحتفظ به فقط على سيرفر توقيع الشهادات.

---

## 3️⃣ إنشاء شهادة لكل سيرفر NATS

### مثال: سيرفر 10.8.0.3

```bash
openssl genrsa -out nats-3.key 2048

openssl req -new -key nats-3.key \
  -subj "/CN=nats-3" \
  -out nats-3.csr
```

ملف **extensions** مهم جدًا:

```bash
cat > nats-3.ext <<EOF
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = 10.8.10.1
DNS.1 = nats-3
EOF
```

توقيع الشهادة:

```bash
openssl x509 -req -in nats-3.csr \
  -CA ca.pem -CAkey ca.key -CAcreateserial \
  -out nats-3.pem -days 365 -sha256 \
  -extfile nats-3.ext
```

### كرر للسيرفر 10.8.0.4

غيّر:

- `nats-4.key / nats-4.csr / nats-4.ext / nats-4.pem`
- IP و CN حسب السيرفر

---

## 4️⃣ نسخ الملفات إلى كل سيرفر

على كل سيرفر:

```
/etc/nats/certs/
├── ca.pem
├── nats-X.pem
└── nats-X.key
```

> `X` = رقم السيرفر

---

## 5️⃣ إعداد NATS مع TLS

```conf
tls {
  cert_file: "/etc/nats/certs/nats-X.pem"
  key_file: "/etc/nats/certs/nats-X.key"
  ca_file: "/etc/nats/certs/ca.pem"
  verify: true
}

cluster {
  name: "nats-cluster"
  listen: "0.0.0.0:6222"

  tls {
    cert_file: "/etc/nats/certs/nats-X.pem"
    key_file: "/etc/nats/certs/nats-X.key"
    ca_file: "/etc/nats/certs/ca.pem"
    verify: true
  }

  routes = [
    "nats://10.8.0.Y:6222"
  ]
}
```

> استبدل `X` و `Y` حسب السيرفرين.

---

## 6️⃣ إعادة التشغيل

```bash
systemctl restart nats
# أو
docker restart nats
```

---

## 7️⃣ النتيجة المتوقعة

```
Route connection established
Cluster formed
JetStream cluster leader elected
```

---

## 8️⃣ ملفات غير مطلوبة

- `rootCA.pem` من mkcert → **احذف لتفادي اللبس**

```bash
rm -f rootCA.pem
```

- `ca.srl` → يستخدم داخليًا عند توقيع الشهادات، لا يُنسخ للسيرفرات ولا يدخل في config.

---

## 9️⃣ ملاحظات أمان

- `ca.key` يبقى فقط على سيرفر CA
- على السيرفرات يكفي:

```
ca.pem
nats-X.pem
nats-X.key
```

---

## 🔑 خلاصة

- mkcert لا يصلح لـ NATS Cluster mTLS
- استخدم OpenSSL مع keyUsage `serverAuth, clientAuth`
- تأكد من تطابق fingerprint لـ `ca.pem` على كل السيرفرات
- هذا إعداد Production-grade جاهز للعمل

---

يمكن إضافة أقسام لاحقة مثل:

- 3-node JetStream
- Leafnodes TLS
- JWT / Operator mode
- Zero Trust NATS
