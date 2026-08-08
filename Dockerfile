# Dockerfile — isolated aic (Pandoc + TeX Live + Unicode fonts)
# Build:  docker build -t aic .
# Run:    ./bin/aic --docker notes.md

FROM pandoc/latex:latest

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
