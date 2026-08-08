# aic

Local **Markdown + LaTeX math → PDF** compiler for huge technical notes (STA / Genus / SDC, etc.).

```
.md  →  preprocess  →  Pandoc  →  .tex  →  xelatex | lualatex | pdflatex  →  .pdf
              ↑                    ↑
     Tcl/box/mermaid          templates / header-includes
```

Same stack used by Quarto, R Markdown, and most serious technical-writing setups.

## Deploy on Oracle Cloud (public HTTP)

See the full guide: **[walkthrough.md](./walkthrough.md)**

Short version on a fresh VM (from repo root):

```bash
sudo bash oracle-deploy.sh
# then open http://YOUR_PUBLIC_IP/
```

Files:

| File | Purpose |
|------|---------|
| `Dockerfile.web` | Next.js + Pandoc + TeX (one image) |
| `docker-compose.yml` | Port **80→3000**, auto-restart |
| `oracle-deploy.sh` | Docker + firewall + `compose up` |
| `walkthrough.md` | Console clicks, Security List, SSH |

---

## Why this exists

Large notes often mix:

- Markdown structure
- `$...$` / `$$...$$` and `\( ... \)` / `\[ ... \]` math
- raw LaTeX (`align`, …)
- **unfenced Tcl/SDC** with `$T` and `{expr …}` (breaks naive Pandoc → LaTeX)
- Unicode **box-drawing tables** and optional **Mermaid** diagrams

A single wrapper keeps flags, math extensions, packages, and page geometry consistent.

## Quick start

### A) Docker (recommended — no host TeX)

```bash
cd ~/Desktop/aic
docker build -t aic .          # once
./bin/aic --docker notes.md    # → notes.pdf
```

### B) Host install (Ubuntu / Debian)

```bash
./scripts/install-deps.sh         # pandoc + texlive + latexmk (+ ~/bin link)
# or: make deps && make install

aic notes.md
aic notes.md out.pdf
```

### C) Call from anywhere

```bash
make install                      # symlink → ~/bin/aic
export PATH="$HOME/bin:$PATH"
aic --docker /path/to/huge.md
```

---

## Usage

```text
aic [options] file.md [out.pdf]
```

### Options

| Option | Description |
|--------|-------------|
| `-e, --engine ENGINE` | `xelatex` (default), `lualatex`, or `pdflatex`. Prefer **`lualatex`** for very long docs. |
| `-m, --margin SIZE` | Page margin (default: `0.7in`) |
| `-s, --fontsize SIZE` | Font size (default: `10pt`; article class allows 10/11/12pt) |
| `--paper SIZE` | `a4` \| `a3` \| `a2` \| `letter` \| `legal` \| `tabloid` |
| `--landscape` | Landscape orientation (more horizontal space) |
| `--wide` | Preset for huge tables: **landscape + A3 + margin 0.5in + 10pt** |
| `--geometry OPTS` | Extra geometry, e.g. `paperwidth=22in,paperheight=11in` |
| `--toc` / `--no-toc` | Table of contents (default: on) |
| `--toc-depth N` | TOC depth (default: 3) |
| `-t, --template NAME` | Use `templates/NAME.latex` (or `~/.pandoc/templates/`) |
| `--no-template` | Do not use a custom template |
| `--tex` | Emit `.tex` only (no PDF) |
| `-w, --watch` | Recompile on change (`latexmk -pvc` if available) |
| `-d, --docker` | Run via Docker image (no host TeX) |
| `--no-preprocess` | Skip Tcl / box-art / mermaid preprocessor |
| `-v, --verbose` | Verbose pandoc / LaTeX output |
| `-h, --help` | Show help |

### Common examples

```bash
# Basic
./bin/aic --docker notes.md
./bin/aic --docker notes.md out.pdf

# Huge docs (better TeX memory)
./bin/aic --docker --engine=lualatex notes.md

# Wide tables (not enough room on portrait A4/Letter)
./bin/aic --docker --wide test.md thumb_rule_sdc_wide.pdf
./bin/aic --docker --landscape --paper a3 --margin 0.4in test.md
./bin/aic --docker --geometry 'paperwidth=22in,paperheight=11in' test.md

# Intermediate TeX only
./bin/aic --tex notes.md

# Watch recompile (host TeX)
aic --watch notes.md
```

### Everyday workflow with `test.md`

```bash
cd ~/Desktop/aic

# Normal notes
./bin/aic --docker --engine=lualatex test.md out.pdf

# Wide SDC/box tables
./bin/aic --docker --wide --engine=lualatex test.md thumb_rule_sdc_wide.pdf

xdg-open thumb_rule_sdc_wide.pdf
```

---

## Wide tables and page size

Portrait A4/Letter only has ~6–7 inches of usable width. Box-drawing tables (~160 characters) will overflow or look crushed.

| Situation | What to use |
|-----------|-------------|
| Normal prose notes | default (portrait) |
| Wide tables | `--wide` or `--landscape --paper a3` |
| Still overflowing | `--geometry 'paperwidth=20in,paperheight=11in'` or split the table in the `.md` |
| Print on A4 printer | A3 landscape will scale down; fine for on-screen reading |

```bash
# Recommended for huge tables
aic --docker --wide notes.md wide.pdf

# Landscape A4 only
aic --docker --landscape --paper a4 --margin 0.5in notes.md

# Custom giant page
aic --docker --geometry 'paperwidth=22in,paperheight=11in' --margin 0.4in notes.md
```

---

## Preprocessor (automatic)

Before Pandoc runs, `bin/aic-preprocess` (unless `--no-preprocess`):

| Input mess | What happens |
|------------|----------------|
| Unfenced Tcl/SDC (`$T`, `[expr {…}]`, `create_clock`, …) | Wrapped in ` ```tcl ` fences so `$` is not treated as math |
| Unicode box-drawing tables / ASCII diagrams | Wrapped in ` ```text ` for monospace layout |
| ` ```mermaid ` blocks | Rendered to PNG (via `mmdc`, `npx @mermaid-js/mermaid-cli`, or Docker `minlag/mermaid-cli`) and embedded as images |

Cache files land in `.aic-cache/` next to the input (safe to delete).

**Why this matters:** bare `set_clock_uncertainty -setup [expr {0.05*$T}]` without fences makes Pandoc/LaTeX fail with `Extra }, or forgotten $.`.

---

## Huge documents / troubleshooting

| Problem | Fix |
|---------|-----|
| Out-of-memory on very long docs | `--engine=lualatex` or split chapters |
| Missing math symbols | `templates/header-includes.tex` loads `amsmath`, `amssymb`, … |
| Slow recompiles | `aic --watch notes.md` |
| Custom look | `make template` then edit `templates/sta-notes.latex` |
| Wide tables clipped | `--wide` / `--landscape` / `--paper a3` / `--geometry …` |
| Tcl `$T` breaks PDF | leave preprocessor on (default); put code in fences in the source if you prefer |
| Missing `✓` / box glyphs | Docker image installs DejaVu fonts; use `--docker` or install DejaVu on host |

```bash
aic --engine=lualatex --margin=0.65in --toc-depth=2 huge.md
aic --watch notes.md
aic --tex notes.md
```

---

## Math extensions

Pandoc input format:

```text
markdown+tex_math_dollars+tex_math_single_backslash+raw_tex+...
```

| Extension | Enables |
|-----------|---------|
| `tex_math_dollars` | `$...$` and `$$...$$` |
| `tex_math_single_backslash` | `\( ... \)` and `\[ ... \]` |
| `raw_tex` | raw environments like `align` |
| `xelatex` / `lualatex` | better Unicode than plain `pdflatex` |

---

## Project layout

```text
aic/
├── bin/aic                 # main compiler wrapper
├── bin/aic-preprocess      # Tcl / box art / mermaid safety net
├── templates/
│   └── header-includes.tex    # amsmath, tables, fonts helpers, …
├── scripts/
│   ├── install-deps.sh        # apt/dnf packages + ~/bin link
│   └── install-template.sh    # dump Pandoc default → sta-notes.latex
├── examples/
│   ├── sample.md
│   └── mermaid_sample.md
├── Dockerfile                 # pandoc/latex + DejaVu fonts
├── Makefile
└── README.md
```

---

## Optional Pandoc template

```bash
make template
# edits: templates/sta-notes.latex  (and ~/.pandoc/templates/sta-notes.latex)

aic --template=sta-notes notes.md
```

Start from Pandoc’s default (`pandoc -D latex`). Customize fonts, headers, colors, title page once.

---

## Docker

```bash
# Build image (once)
docker build -t aic .

# Preferred: full flag set + preprocess + fonts
./bin/aic --docker notes.md
./bin/aic --docker --wide notes.md wide.pdf

# Manual pandoc in the image (you must pass math flags yourself)
docker run --rm -v "$PWD":/work -w /work aic \
  notes.md -o notes.pdf \
  --pdf-engine=xelatex \
  --from markdown+tex_math_dollars+tex_math_single_backslash \
  --toc --standalone
```

Prefer `./bin/aic --docker …` so math flags, header-includes, fonts, and preprocess stay consistent.

---

## Environment

| Variable | Meaning |
|----------|---------|
| `PDF_ENGINE` | default engine (`xelatex`) |
| `AIC_PAPER` | default paper size (`a4`, `a3`, …) |
| `AIC_GEOMETRY` | default extra geometry options |
| `AIC_TEMPLATE_DIR` | template search path |
| `AIC_HEADER` | path to header-includes `.tex` |
| `AIC_DOCKER_IMAGE` | docker image name (default `aic`) |

---

## Smoke test

```bash
# host TeX
make sample

# Docker
make sample-docker
# or:
./bin/aic --docker examples/sample.md
./bin/aic --docker --wide test.md /tmp/wide.pdf
```

`examples/sample.md` exercises dollar math, backslash math, `align`, tables, and code.
