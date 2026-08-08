# md2pdf Web UI (localhost)

Next.js front-end for the local `md2pdf` compiler.

## Speed model

| Size / setup | Backend | Typical time |
|--------------|---------|----------------|
| Small PDF + **tectonic** installed | **local** | ~8–15s |
| Large PDF (&gt;50KB) or no host TeX | **docker** | ~15–90s |
| DOCX / TEX | always **local** pandoc | a few seconds |

```bash
# one-time: fast local engine (no full TeX Live)
cd /path/to/md2pdf
./scripts/install-fast-deps.sh

# optional: docker for big docs
docker build -t md2pdf .
```

## Run

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000  

UI defaults: **Backend=Auto**, **Engine=Auto**, **TOC off** (faster).

Optional:

```bash
export MD2PDF_ROOT=/path/to/md2pdf
export PATH="$HOME/.local/bin:$PATH"
npm run dev
```

## Compile flow

1. Browser `POST /api/compile`  
2. API runs:

   ```bash
   bin/md2pdf --backend auto|local|docker --engine auto|tectonic|… file.md out.pdf
   ```

3. File download; response headers: `X-Md2pdf-Backend`, `X-Md2pdf-Engine`, `X-Md2pdf-Ms`

## Health check

```bash
curl -s http://localhost:3000/api/compile | jq
# fastLocal: true  → small files will use host tectonic
```
