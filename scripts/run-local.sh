#!/usr/bin/env bash

echo "Starting locally"

npx serverless dynamodb install --stage dev --region "$REGION" --param="profile=$PROFILE"

export NODE_OPTIONS=--enable-source-maps
export SLS_DEBUG="*"
node --inspect ./node_modules/serverless/bin/serverless offline start --stage dev --region "$REGION" --param="profile=$PROFILE" --httpPort 4000
