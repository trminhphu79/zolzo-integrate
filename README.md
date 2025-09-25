# **ZOLOZ RealId Integration — Technical Flow (NestJS)**

---

## **Overview**

The integration follows **ZOLOZ Two-Way Authentication Protocol**.

Every API call is:

- **Signed** with your merchant private key
- Optionally **encrypted** with AES (key wrapped by RSA-OAEP)
- **Verified** with ZOLOZ public key

This ensures:

- Integrity → request/response cannot be tampered
- Authenticity → response comes from ZOLOZ
- Confidentiality → sensitive PII is encrypted

---

## **End-to-End Request Lifecycle**

### **1. Build request body (Body)**

- Construct the JSON payload according to ZOLOZ API spec (e.g. bizId, h5ModeConfig).
- This payload is the **business content** to send to ZOLOZ.

**Relation to Code**

- Called from: ZolozCallerService.callInitialize()
- Input: bizContent object passed from controller DTO

---

### **2. Apply encryption (optional)**

If **encryption is enabled**:

- Generate random **AES-256 key**
- Encrypt the bizContent JSON with AES-CBC
- Encrypt AES key with **ZOLOZ public key** using RSA-OAEP
- Add Encrypt header:

```jsx
Encrypt: algorithm=RSA_AES, symmetricKey=<RSA-OAEP encrypted AES key>
```

- Set Content-Type: text/plain (encrypted payload)

If **encryption is disabled**:

- Use plain JSON body
- Set Content-Type: application/json

**Relation to Code**

- File: crypto.helper.ts
- Functions: aesGenerateKey, aesEncryptBase64, rsaOaepEncryptBase64
- Used inside: TwoWayAuthProtocolService.buildRequest()

### **3. Sign request**

- Build **string-to-sign**:

```jsx
POST /api/{apiName}
{clientId}.{requestTime}.{requestBody}
```

- Sign with **merchant private key (RSA-SHA256)**
- Add Signature header:

```jsx
Signature: algorithm=RSA256, signature=<base64>
```

Also add:

- Client-Id: <your_client_id>
- Request-Time: <formatted timestamp>

**Relation to Code**

- File: crypto.helper.ts
- Function: rsaSha256SignBase64()
- Used in: TwoWayAuthProtocolService.buildRequest()

### **4. Send to ZOLOZ endpoint**

Example for initialize:

```jsx
POST {ZOLOZ_HOST}/api/v1/zoloz/realid/initialize
```

- Send signed + (optionally) encrypted body
- Attach headers (Client-Id, Signature, Request-Time, Encrypt)

**Relation to Code**

- File: zoloz-caller.service.ts
- Function: axios.post(url, context.requestBody, { headers })

---

### **5. Receive response**

On response:

- **Verify signature**
    - Extract Signature + Response-Time headers
    - Build string-to-verify:

```jsx
POST /api/{apiName}
{clientId}.{responseTime}.{responseBody}
```

- Verify with **ZOLOZ public key**
- **Decrypt if needed**
    - If Encrypt header present:
        - RSA-OAEP decrypt symmetric key using your **merchant private key**
        - AES decrypt the response body
        

**Relation to Code**

- File: crypto.helper.ts
    - rsaSha256VerifyBase64() → signature verification
    - rsaOaepDecrypt() + aesDecryptBase64() → decrypt
- File: two-way-auth.protocol.ts
    - Function: parseResponse()

---

### **6. Return parsed JSON**

- After verifying + decrypting → return clean JSON
- Forward to controller → frontend

## **Example: Initialize Flow**

1. Backend calls callInitialize(body content)
2. TwoWayAuthProtocolService.buildRequest()
    - Encrypts body (if enabled)
    - Signs request
    - Sets headers
3. Axios sends request → ZOLOZ API
4. TwoWayAuthProtocolService.parseResponse()
    - Verifies ZOLOZ signature
    - Decrypts body if encrypted
5. Backend returns plain JSON: