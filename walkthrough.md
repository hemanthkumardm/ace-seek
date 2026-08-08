# AIC on Oracle Cloud — step-by-step walkthrough

Deploy the **AIC** web UI (Markdown + LaTeX → PDF) on a free-tier Oracle Cloud VM so you can open it in a browser at `http://YOUR_PUBLIC_IP/`.

---

## What you will end up with

```text
Browser  →  http://PUBLIC_IP:80
                ↓
         Docker: aic-web
         (Next.js + Pandoc + TeX in one container)
```

Compiles use **TeX inside the same container** (`AIC_FORCE_LOCAL=1`). You do **not** need a second Docker image on the server for PDF builds.

---

## Part A — Create the Oracle VM

1. Sign in to [Oracle Cloud Console](https://cloud.oracle.com/).
2. **☰ Menu → Compute → Instances → Create Instance**.
3. Name: e.g. `aic-server`.
4. **Image**: Canonical Ubuntu 22.04 (or Oracle Linux 8/9).
5. **Shape**: Always Free eligible, e.g. **VM.Standard.A1.Flex** (Ampere) or **VM.Standard.E2.1.Micro**.
   - Prefer **≥ 2 OCPU / 12 GB RAM** if available (TeX is heavy). Micro shapes may OOM on large PDFs.
6. **Networking**: create/use a VCN with a **public subnet** and assign a **public IP**.
7. **SSH keys**: paste your public key (or generate and download the private key).
8. Click **Create**. Wait until state is **Running**.
9. Note the **Public IP address**.

---

## Part B — Open the cloud firewall (Security List / NSG)

Oracle blocks inbound traffic until you allow it **in the console** (this is separate from Linux `iptables`).

1. Open your instance → **Subnet** link → **Security Lists** (or **Network Security Groups**).
2. **Ingress Rules → Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0` (or lock to your IP later)
   - **IP Protocol**: TCP  
   - **Destination Port**: `80`  
   - Description: `AIC HTTP`
3. Save. (Optional: also open `22` if SSH is not already allowed.)

Without this step, the deploy script can succeed but the site stays unreachable from the internet.

---

## Part C — SSH into the server

From your laptop:

```bash
# Ubuntu image default user is usually "ubuntu"
ssh -i /path/to/private_key ubuntu@YOUR_PUBLIC_IP

# Oracle Linux image default user is usually "opc"
ssh -i /path/to/private_key opc@YOUR_PUBLIC_IP
```

---

## Part D — Get the code on the server

**Option 1 — Git (recommended)**

```bash
sudo apt-get update && sudo apt-get install -y git   # Ubuntu
# or: sudo dnf install -y git                        # Oracle Linux

git clone https://github.com/YOUR_USER/YOUR_REPO.git aic
cd aic
```

**Option 2 — Copy from your laptop**

```bash
# on laptop, from the project folder:
rsync -avz -e "ssh -i /path/to/key" \
  --exclude node_modules --exclude .next --exclude web/node_modules \
  ./ ubuntu@YOUR_PUBLIC_IP:~/aic/
ssh -i /path/to/key ubuntu@YOUR_PUBLIC_IP
cd ~/aic
```

---

## Part E — Run the one-click deploy script

```bash
cd ~/aic   # repository root (must contain docker-compose.yml + Dockerfile.web)
sudo bash oracle-deploy.sh
```

The script will:

1. Install packages  
2. Open **port 80** in the OS firewall (`firewalld` or `iptables`)  
3. Install **Docker** + Compose  
4. `docker compose up -d --build`  
5. Print the URL  

First build can take **10–20+ minutes** (Pandoc/TeX base image is large).

---

## Part F — Verify

On the server:

```bash
docker compose ps
docker compose logs -f aic-web
curl -s http://127.0.0.1/api/compile | head
```

On your laptop browser:

```text
http://YOUR_PUBLIC_IP/
```

You should see the AIC preview studio. Compile a small sample, wait for the preview, then Download.

---

## Day-2 operations

| Task | Command |
|------|---------|
| Logs | `docker compose logs -f aic-web` |
| Restart | `docker compose restart` |
| Rebuild after `git pull` | `docker compose up -d --build` |
| Stop | `docker compose down` |
| Shell inside container | `docker exec -it aic-web sh` |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Browser hangs / timeout | Confirm **Security List port 80** and `curl http://PUBLIC_IP/` from laptop |
| `Connection refused` | `docker compose ps` — is `aic-web` up? `docker compose logs` |
| Compile fails inside UI | `docker compose logs -f aic-web` — TeX errors appear there |
| Out of memory (OOM) | Use a larger shape; avoid huge docs on E2.1.Micro |
| SSH works, HTTP does not | Almost always **cloud security list**, not the app |
| Rebuild after code change | `git pull && sudo docker compose up -d --build` |

---

## Files involved

| File | Role |
|------|------|
| `Dockerfile.web` | Next.js + Pandoc + TeX + `bin/aic` in one image |
| `docker-compose.yml` | Runs container, maps **80→3000**, restart policy |
| `oracle-deploy.sh` | Install Docker, open firewall, compose up |
| `walkthrough.md` | This guide |

---

## Security notes (later)

- Prefer HTTPS (Caddy/Nginx + Let’s Encrypt) before sharing publicly.  
- Restrict Security List source CIDR to your IP if this is only for you.  
- The free public demo has **no auth** — anyone who knows the IP can compile (CPU cost). Add a simple password or Cloudflare Access before promoting the URL.
