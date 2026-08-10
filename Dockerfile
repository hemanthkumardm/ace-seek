# Dockerfile — isolated aic (Pandoc + TeX Live + Unicode fonts)
# Build:  docker build --platform linux/amd64 -t aic .
# Run:    ./bin/aic --docker notes.md
#
# Note: pandoc/latex is amd64-only. On Apple Silicon use amd64 (QEMU via Colima/Docker).

FROM --platform=linux/amd64 pandoc/latex:latest

USER root

# Unicode fonts for box-drawing tables, checkmarks, ≠, etc.
# Alpine packages used by pandoc/latex base image.
RUN apk add --no-cache \
      font-dejavu \
      fontconfig \
      ttf-freefont \
      python3 \
    && fc-cache -f

WORKDIR /work
ENTRYPOINT ["pandoc"]
