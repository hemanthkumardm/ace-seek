# Resend Domain Verification DNS Records for ace-seek.com

Add these DNS records at your domain registrar / DNS provider (Hostinger / GoDaddy / Cloudflare / Route53) for `ace-seek.com`:

---

### 1. DKIM Record
- **Type**: `TXT`
- **Name / Host**: `resend._domainkey`
- **Value / Content**: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDTjNrwHdugBgLACCQYesi8mKhN+Dm2myMQKEEmqMFW5uW7zGKQMLrgpD4kx2Wo+V6G86usaZJN35G4lYlmtPDo9QXbvU483kvReYhL+TUba0EnKZJkvJx22Xlw+gdrzMNwNzxKZ3hX43+C/jTs9aP8PijlEdqiGtatnobP+SRykwIDAQAB`
- **TTL**: Auto / 3600

---

### 2. SPF Records (Mail Return Path)
- **Type**: `MX`
- **Name / Host**: `send`
- **Value / Target**: `feedback-smtp.ap-northeast-1.amazonses.com`
- **Priority**: `10`

- **Type**: `TXT`
- **Name / Host**: `send`
- **Value / Content**: `v=spf1 include:amazonses.com ~all`

---

### 3. DMARC Record
- **Type**: `TXT`
- **Name / Host**: `_dmarc`
- **Value / Content**: `v=DMARC1; p=none;`

---

### 4. MX Inbound Record (Optional Receiving)
- **Type**: `MX`
- **Name / Host**: `@` (or leave blank)
- **Value / Target**: `inbound-smtp.ap-northeast-1.amazonaws.com`
- **Priority**: `0`

---

Once added in your DNS manager, click **"Verify Domain"** inside your Resend Dashboard.
