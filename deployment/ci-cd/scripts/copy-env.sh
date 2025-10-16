#!/bin/bash

ENV=$1  # ambiente: dev, prod, test

# Define rutas base
BASE_DEPLOY_PATH="./deployment/config/env"
SERVICES=("calendar-service" "event-service" "notification-service" "api-gateway")

for service in "${SERVICES[@]}"
do
  SRC_ENV_FILE="$BASE_DEPLOY_PATH/${ENV}.env"
  DEST_DIR="./services/$service"
  DEST_ENV_FILE="$DEST_DIR/.env"

  cp $SRC_ENV_FILE $DEST_ENV_FILE
  echo "Copied $SRC_ENV_FILE to $DEST_ENV_FILE"
done