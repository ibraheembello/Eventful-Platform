#!/bin/bash

# Eventful Platform - Continue Deployment Script
# Run this after PostgreSQL server is created

set -e

echo "🚀 Continuing Eventful Platform deployment..."

# Configuration
RESOURCE_GROUP="eventful-platform-prod"
APP_NAME="eventful-api"
POSTGRES_SERVER="eventful-postgres-db"
POSTGRES_ADMIN="eventfuladmin"
POSTGRES_PASSWORD="Ib65426444."
POSTGRES_DB="eventful_production"

# Secrets
JWT_ACCESS_SECRET="84fee49fbf3f6d9b45af12b0a351a42dd41a1f87d8afe27452071b1e5c38075f"
JWT_REFRESH_SECRET="66abafba750784971cd9d38b54d0e39732216a7b70a397598e84b86eda92f2d6"
PAYSTACK_SECRET_KEY="sk_test_b2c5e9cb8b241f7860fd1e86fb74ae6188e9d4ab"
PAYSTACK_PUBLIC_KEY="pk_test_81aca4e5892519d8bbf6b0f94f76956c1dd36625"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Create database
echo -e "${BLUE}💾 Creating database...${NC}"
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --database-name $POSTGRES_DB

# Step 2: Configure firewall
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Step 3: Build DATABASE_URL
POSTGRES_HOST="${POSTGRES_SERVER}.postgres.database.azure.com"
DATABASE_URL="postgresql://${POSTGRES_ADMIN}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?sslmode=require"

# Step 4: Configure environment variables
echo -e "${BLUE}⚙️  Configuring environment variables...${NC}"
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

# Step 5: Enable logs
echo -e "${BLUE}📊 Enabling application logs...${NC}"
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem

# Step 6: Build application
echo -e "${BLUE}📤 Building application...${NC}"
npm run build

# Step 7: Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
zip -r deploy.zip . \
  -x "*.git*" \
  -x "node_modules/*" \
  -x "client/node_modules/*" \
  -x "tests/*" \
  -x "*.md" \
  -x "deploy.zip"

# Step 8: Deploy to Azure
echo -e "${BLUE}🚀 Deploying to Azure...${NC}"
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src deploy.zip

# Step 9: Wait for deployment
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
sleep 30

# Step 10: Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
az webapp ssh \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --command "cd /home/site/wwwroot && npx prisma generate && npx prisma migrate deploy"

# Clean up
rm deploy.zip

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your app is available at: https://${APP_NAME}.azurewebsites.net${NC}"
echo -e "${GREEN}📊 View logs: az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME${NC}"
echo -e "${GREEN}🔍 Check health: curl https://${APP_NAME}.azurewebsites.net/api/health${NC}"
