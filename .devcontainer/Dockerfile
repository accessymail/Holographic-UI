# Controlled Linux build environment definition.
# This image is a BUILD ENVIRONMENT CONTRACT, not certification evidence.
FROM node:22.16.0-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential curl pkg-config libssl-dev libwebkit2gtk-4.1-dev \
       libayatana-appindicator3-dev librsvg2-dev patchelf \
    && rm -rf /var/lib/apt/lists/*

# Rust installation is intentionally performed by the bootstrap script so the
# selected Rust toolchain can be recorded in build evidence rather than hidden
# inside an untracked image layer.
WORKDIR /workspace
