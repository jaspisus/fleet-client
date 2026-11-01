#!/usr/bin/env sh
# Linux node_modules live in a named volume, because the host's macOS native binaries cannot run in the container.
set -eu

cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "Visual tests run in Docker: start Docker and try again." >&2
  exit 1
fi

version=$(node -p "require('@playwright/test/package.json').version")
tty=$([ -t 1 ] && echo -t || true)

exec docker run --rm --init --ipc=host $tty \
  -e VISUAL_DOCKER=1 \
  -v "$PWD":/work -w /work \
  -v fleet-client-node-modules:/work/node_modules \
  -v fleet-client-npm-cache:/root/.npm \
  -v "$PWD/e2e/support/fonts.conf":/etc/fonts/local.conf:ro \
  "mcr.microsoft.com/playwright:v$version-noble" \
  sh -c '
    set -eu
    lock=$(sha1sum package-lock.json)
    if [ "$(cat node_modules/.lock-sha1 2>/dev/null)" != "$lock" ]; then
      npm ci --no-audit --no-fund
      echo "$lock" > node_modules/.lock-sha1
    fi
    exec npx playwright test --project="visual-*" "$@"
  ' sh "$@"
