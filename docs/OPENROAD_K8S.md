# OpenROAD Kubernetes worker (Sprint 3)

Single-host EC2 can keep dispatch **inside Next.js** (default). For multi-pod or
dedicated workers, set:

```env
OPENROAD_QUEUE_EXTERNAL=1
OPENROAD_JOBS_DIR=/data/ace-openroad-jobs
```

Next.js then **only enqueues** (`status.json=queued` + `spawn.json`). A worker
process admits and runs OpenLane.

## Worker process

```bash
cd workers/openroad
export OPENROAD_JOBS_DIR=/data/ace-openroad-jobs
export PDK_ROOT=/data/volare
export OPENROAD_MAX_CONCURRENT_JOBS=1
node queue_worker.mjs
```

systemd example:

```ini
[Unit]
Description=Ace-Seek OpenLane queue worker
After=docker.service

[Service]
WorkingDirectory=/opt/ace-seek/workers/openroad
Environment=OPENROAD_JOBS_DIR=/data/ace-openroad-jobs
Environment=PDK_ROOT=/data/volare
Environment=OPENROAD_MAX_CONCURRENT_JOBS=1
ExecStart=/usr/bin/node queue_worker.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

## Kubernetes

See `workers/openroad/k8s/deployment.yaml`:

- Shared PVC for `OPENROAD_JOBS_DIR` (same mount as the web API)
- PDK volume + Docker socket (or DinD)
- **replicas: 1** on RWO volumes — multi-replica needs RWX (EFS/NFS) and
  careful locking

## Isolation (unchanged)

Jobs remain under `owners/<ownerId>/jobs/…` (Sprint A). Queue caps from Sprint 2
still apply in the worker.

## Redis / autoscaling

Still later. Disk queue on shared PVC is the v1 contract.
