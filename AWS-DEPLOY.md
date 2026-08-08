# Deploy AIC on AWS EC2

## 0. Security Group (AWS Console) — do this first

**EC2 → Instances → your instance → Security tab → Security group → Edit inbound rules**

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | My IP (or 0.0.0.0/0 for testing) |
| HTTP | 80 | 0.0.0.0/0 |

Save. Without **port 80**, the site will not open in a browser.

---

## 1. From your laptop — rsync the project

Replace `YOUR_PUBLIC_IP` and the SSH user:

- **Ubuntu AMI** → user `ubuntu`
- **Amazon Linux** → user `ec2-user`

```bash
chmod 400 ~/Downloads/kinetiq.pem

# Example: Ubuntu
rsync -avz -e "ssh -i ~/Downloads/kinetiq.pem" \
  --exclude node_modules \
  --exclude web/node_modules \
  --exclude .next \
  --exclude web/.next \
  --exclude .git \
  --exclude docs \
  --exclude md_docs \
  ~/Desktop/md2pdf/ \
  ubuntu@YOUR_PUBLIC_IP:~/md2pdf/

# Example: Amazon Linux — use ec2-user@ instead of ubuntu@
```

---

## 2. SSH in and deploy

```bash
ssh -i ~/Downloads/kinetiq.pem ubuntu@YOUR_PUBLIC_IP
# or: ssh -i ~/Downloads/kinetiq.pem ec2-user@YOUR_PUBLIC_IP

cd ~/md2pdf
sudo bash aws-deploy.sh
```

First build can take **10–20+ minutes** (Pandoc/TeX image is large).  
On **t2.micro / t3.micro**, the script creates a **4GB swap** so the build does not die from OOM.

---

## 3. Open the app

```text
http://YOUR_PUBLIC_IP/
```

Health check:

```bash
curl -s http://127.0.0.1/api/compile
docker compose logs -f aic-web
```

---

## Useful commands (on the instance)

```bash
cd ~/md2pdf
docker compose ps
docker compose logs -f aic-web
docker compose restart
docker compose down
# after code update from laptop:
#   rsync again, then:
sudo docker compose up -d --build
```
