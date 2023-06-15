#!/usr/bin/env bash

echo "Starting locally"

sam local start-api --docker-network lambda-local
