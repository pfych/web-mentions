#!/usr/bin/env bash

# We're not using SAMs build tool since they bundle weirdly and cause issues with AWS SDK
# Instead we're building with esbuild ourself then referencing the build in the template.yaml

esbuild src/handler.ts \
  --target=es2020 \
  --platform=node \
  --bundle \
  --external:aws-sdk \
  --sourcemap=linked \
  --outfile=.build/handler.js
