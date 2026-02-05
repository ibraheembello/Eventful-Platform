#!/bin/bash

# Eventful Platform - Azure Deployment Script
# This script deploys the application to Azure App Service

set -e

echo "🚀 Starting Eventful Platform deployment to Azure..."

# Configuration
RESOURCE_GROUP="eventful-platform-prod"
LOCATION="uksouth"
APP_SERVICE_PLAN="eventful-app-plan"
APP_NAME="eventful-api"
POSTGRES_SERVER="eventful-postgres-db"
POSTGRES_ADMIN="eventfuladmin"
POSTGRES_DB="eventful_production"
NODE_VERSION="20-lts"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create Resource Group
echo -e "${BLUE}📦 Creating resource group in UK South...${NC}"
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Step 2: Create App Service Plan (B1 tier for development)
echo -e "${BLUE}📋 Creating App Service Plan...${NC}"
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Step 3: Create Web App
echo -e "${BLUE}🌐 Creating Web App...${NC}"
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $APP_NAME \
  --runtime "NODE:$NODE_VERSION"

# Step 4: Create PostgreSQL Flexible Server
echo -e "${BLUE}🗄️  Creating PostgreSQL server...${NC}"
echo -e "${YELLOW}⚠️  Please enter a secure password for PostgreSQL admin:${NC}"
read -s POSTGRES_PASSWORD

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --location $LOCATION \
  --admin-user $POSTGRES_ADMIN \
  --admin-password "$POSTGRES_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0

# Step 5: Create database
echo -e "${BLUE}💾 Creating database...${NC}"
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --database-name $POSTGRES_DB

# Step 6: Configure firewall to allow Azure services
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Step 7: Get PostgreSQL connection string
POSTGRES_HOST="${POSTGRES_SERVER}.postgres.database.azure.com"
DATABASE_URL="postgresql://${POSTGRES_ADMIN}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?sslmode=require"

# Step 8: Configure App Settings (Environment Variables)
echo -e "${BLUE}⚙️  Configuring environment variables...${NC}"
echo -e "${YELLOW}⚠️  Please enter your Paystack Secret Key:${NC}"
read -s PAYSTACK_SECRET_KEY

echo -e "${YELLOW}⚠️  Please enter your Paystack Public Key:${NC}"
read PAYSTACK_PUBLIC_KEY

echo -e "${YELLOW}⚠️  Please enter your JWT Access Secret (32+ characters):${NC}"
read -s JWT_ACCESS_SECRET

echo -e "${YELLOW}⚠️  Please enter your JWT Refresh Secret (32+ characters):${NC}"
read -s JWT_REFRESH_SECRET

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    NODE_ENV="production" \
    PORT="8080" \
    JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET" \
    JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
    PAYSTACK_SECRET_KEY="$PAYSTACK_SECRET_KEY" \
    PAYSTACK_PUBLIC_KEY="$PAYSTACK_PUBLIC_KEY" \
    CLIENT_URL="https://${APP_NAME}.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    WEBSITE_NODE_DEFAULT_VERSION="~20"

# Step 9: Enable logs
echo -e "${BLUE}📊 Enabling application logs...${NC}"
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem

# Step 10: Deploy code
echo -e "${BLUE}📤 Deploying application...${NC}"
cd "$(dirname "$0")"
npm run build

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
zip -r deploy.zip . -x "*.git*" "node_modules/*" "client/node_modules/*" "tests/*" "*.md"

az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src deploy.zip

# Step 11: Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
az webapp ssh \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --command "cd /home/site/wwwroot && npx prisma migrate deploy"

# Clean up
rm deploy.zip

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your app is available at: https://${APP_NAME}.azurewebsites.net${NC}"
echo -e "${GREEN}📊 View logs: az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME${NC}"
