📌 Overview

The integration follows ZOLOZ Two-Way Authentication Protocol.
Every API call is:
• ✍️ Signed with your merchant private key
• 🔒 Optionally encrypted with AES (key wrapped by RSA-OAEP)
• ✅ Verified with ZOLOZ public key

This ensures:
• Integrity → request/response cannot be tampered
• Authenticity → response comes from ZOLOZ
• Confidentiality → sensitive PII is encrypted

⸻

🔄 End-to-End Request Lifecycle

1. Build request body (bizContent)
   • Construct the JSON payload according to ZOLOZ API spec (e.g. bizId, h5ModeConfig).
   • This payload is the business content to send to ZOLOZ.

⸻

2. Apply encryption (optional)

If encryption is enabled:
• Generate random AES-256 key
• Encrypt the bizContent JSON with AES-CBC
• Encrypt AES key with ZOLOZ public key using RSA-OAEP
• Add Encrypt header:
Encrypt: algorithm=RSA_AES, symmetricKey=<RSA-OAEP encrypted AES key>
	•	Set Content-Type: text/plain (encrypted payload)

If encryption is disabled:
	•	Use plain JSON body
	•	Set Content-Type: application/json

3. Sign request
	•	Build string-to-sign:
  POST /api/{apiName}
  {clientId}.{requestTime}.{requestBody}
	•	Sign with merchant private key (RSA-SHA256)
	•	Add Signature header:
  Signature: algorithm=RSA256, signature=<base64>
  Also add:
	•	Client-Id: <your_client_id>
	•	Request-Time: <formatted timestamp>

4. Send to ZOLOZ endpoint

Example for initialize:
POST {ZOLOZ_HOST}/api/v1/zoloz/realid/initialize
	•	Send signed + (optionally) encrypted body
	•	Attach headers (Client-Id, Signature, Request-Time, Encrypt)

⸻

5. Receive response
On response:
	•	Verify signature
	•	Extract Signature + Response-Time headers
	•	Build string-to-verify:
  POST /api/{apiName}
  {clientId}.{responseTime}.{responseBody}
	•	Verify with ZOLOZ public key
	•	Decrypt if needed
	•	If Encrypt header present:
	•	RSA-OAEP decrypt symmetric key using your merchant private key
	•	AES decrypt the response body

⸻

6. Return parsed JSON
	•	After verifying + decrypting → return clean JSON
	•	Forward to controller → frontend


Example: Initialize Flow
	1.	Backend calls callInitialize(bizContent)
	2.	TwoWayAuthProtocolService.buildRequest()
	•	Encrypts body (if enabled)
	•	Signs request
	•	Sets headers
	3.	Axios sends request → ZOLOZ API
	4.	TwoWayAuthProtocolService.parseResponse()
    •	Verifies ZOLOZ signature
    •	Decrypts body if encrypted
	5.	Backend returns plain JSON:
  {
  "transactionId": "2025092500012345678",
  "clientCfg": {
    "h5Url": "https://zoloz.com/realid/h5?txn=2025092500012345678",
    "locale": "en_US"
  }
}

 Key Headers
	•	Client-Id → your ZOLOZ Client ID
	•	Signature → signed request string (RSA-SHA256)
	•	Request-Time → timestamp (strict format)
	•	Encrypt → included only if encryption is enabled
	•	Response-Time → from ZOLOZ, used for response signature validation