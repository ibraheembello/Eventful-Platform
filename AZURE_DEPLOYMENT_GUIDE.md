# 🚀 Azure Deployment Guide - Eventful Platform

This guide will help you deploy the Eventful Platform to Azure App Service in UK South region.

## 📋 Prerequisites

✅ Azure CLI installed and logged in (`az login`)
✅ Node.js 18+ installed
✅ Git Bash or Linux/Mac terminal
✅ Paystack API keys (test or production)

---

## 🎯 Quick Deployment (Automated)

### Option 1: One-Command Deployment

```bash
npm run deploy:azure
```

This script will:
1. Create Azure Resource Group in UK South
2. Create App Service Plan (B1 tier)
3. Create Web App (Node.js 18)
4. Create PostgreSQL Flexible Server
5. Configure firewall rules
6. Set environment variables
7. Build and deploy the application
8. Run database migrations

**Time:** ~15-20 minutes

---

## 🔧 Manual Deployment (Step-by-Step)

If you prefer manual control, follow these steps:

### Step 1: Create Resource Group

```bash
az group create \
  --name eventful-platform-prod \
  --location uksouth
```

### Step 2: Create App Service Plan

```bash
az appservice plan create \
  --name eventful-app-plan \
  --resource-group eventful-platform-prod \
  --sku B1 \
  --is-linux
```

### Step 3: Create Web App

```bash
az webapp create \
  --resource-group eventful-platform-prod \
  --plan eventful-app-plan \
  --name eventful-api \
  --runtime "NODE:18-lts"
```

### Step 4: Create PostgreSQL Server

```bash
# Replace YOUR_SECURE_PASSWORD with a strong password
az postgres flexible-server create \
  --resource-group eventful-platform-prod \
  --name eventful-postgres-db \
  --location uksouth \
  --admin-user eventfuladmin \
  --admin-password YOUR_SECURE_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0
```

### Step 5: Create Database

```bash
az postgres flexible-server db create \
  --resource-group eventful-platform-prod \
  --server-name eventful-postgres-db \
  --database-name eventful_production
```

### Step 6: Configure Firewall

```bash
az postgres flexible-server firewall-rule create \
  --resource-group eventful-platform-prod \
  --name eventful-postgres-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Step 7: Set Environment Variables

```bash
# Build DATABASE_URL
DATABASE_URL="postgresql://eventfuladmin:YOUR_PASSWORD@eventful-postgres-db.postgres.database.azure.com:5432/eventful_production?sslmode=require"

az webapp config appsettings set \
  --resource-group eventful-platform-prod \
  --name eventful-api \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    NODE_ENV="production" \
    PORT="8080" \
    JWT_ACCESS_SECRET="your-32-char-secret-here" \
    JWT_REFRESH_SECRET="your-32-char-secret-here" \
    PAYSTACK_SECRET_KEY="sk_test_your_key" \
    PAYSTACK_PUBLIC_KEY="pk_test_your_key" \
    CLIENT_URL="https://eventful-api.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    WEBSITE_NODE_DEFAULT_VERSION="~18"
```

### Step 8: Build Application

```bash
npm install
npm run build
```

### Step 9: Deploy

```bash
# Create ZIP package
zip -r deploy.zip . -x "*.git*" "node_modules/*" "client/node_modules/*" "tests/*" "*.md"

# Deploy
az webapp deployment source config-zip \
  --resource-group eventful-platform-prod \
  --name eventful-api \
  --src deploy.zip

# Clean up
rm deploy.zip
```

### Step 10: Run Database Migrations

```bash
# Using Kudu console or SSH
az webapp ssh \
  --resource-group eventful-platform-prod \
  --name eventful-api \
  --command "cd /home/site/wwwroot && npx prisma migrate deploy"
```

---

## 🔐 Security Secrets

Generate secure secrets for JWT:

```bash
# Generate 32-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get two different secrets for ACCESS and REFRESH tokens.

---

## 📊 Post-Deployment

### View Application

```
https://eventful-api.azurewebsites.net
```

### View API Documentation

```
https://eventful-api.azurewebsites.net/api/docs
```

### View Logs

```bash
# Stream logs in real-time
az webapp log tail \
  --resource-group eventful-platform-prod \
  --name eventful-api

# Download logs
az webapp log download \
  --resource-group eventful-platform-prod \
  --name eventful-api \
  --log-file logs.zip
```

### Check Health

```bash
curl https://eventful-api.azurewebsites.net/api/health
```

---

## 🔄 Continuous Deployment (GitHub Actions)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install and Build
        run: |
          npm install
          npm run build

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'eventful-api'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

Get publish profile:

```bash
az webapp deployment list-publishing-profiles \
  --resource-group eventful-platform-prod \
  --name eventful-api \
  --xml
```

Add the output to GitHub Secrets as `AZURE_WEBAPP_PUBLISH_PROFILE`.

---

## 🛠️ Troubleshooting

### Application Won't Start

1. Check logs:
   ```bash
   az webapp log tail --resource-group eventful-platform-prod --name eventful-api
   ```

2. Verify environment variables:
   ```bash
   az webapp config appsettings list --resource-group eventful-platform-prod --name eventful-api
   ```

3. Restart app:
   ```bash
   az webapp restart --resource-group eventful-platform-prod --name eventful-api
   ```

### Database Connection Issues

1. Check firewall rules
2. Verify DATABASE_URL format
3. Test connection from Kudu console:
   ```bash
   npm install pg
   node -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>console.log('OK'))"
   ```

### Frontend Not Loading

1. Verify build succeeded:
   ```bash
   ls -la client/dist
   ```

2. Check NODE_ENV is set to "production"
3. Verify Express static file serving configuration

---

## 💰 Cost Management

### Current Configuration (B1 tier):
- **App Service**: ~$13-55/month
- **PostgreSQL**: ~$25-50/month
- **Total**: ~$38-105/month

### To Reduce Costs:
- Use **F1 Free tier** for App Service (limited to 60 min/day)
- Use **Burstable B1ms** for PostgreSQL (current config)
- Stop resources when not in use

### To Stop Resources:
```bash
az webapp stop --resource-group eventful-platform-prod --name eventful-api
az postgres flexible-server stop --resource-group eventful-platform-prod --name eventful-postgres-db
```

### To Start Resources:
```bash
az webapp start --resource-group eventful-platform-prod --name eventful-api
az postgres flexible-server start --resource-group eventful-platform-prod --name eventful-postgres-db
```

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | Yes | Set to "production" |
| `PORT` | Yes | Set to "8080" for Azure |
| `JWT_ACCESS_SECRET` | Yes | 32+ character secret |
| `JWT_REFRESH_SECRET` | Yes | 32+ character secret |
| `PAYSTACK_SECRET_KEY` | Yes | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | Yes | Paystack public key |
| `CLIENT_URL` | Yes | Your app URL |
| `REDIS_URL` | Optional | Redis connection (if using) |

---

## 🔗 Useful Commands

```bash
# View all resources
az resource list --resource-group eventful-platform-prod --output table

# Scale up App Service
az appservice plan update --resource-group eventful-platform-prod --name eventful-app-plan --sku P1V3

# Update single environment variable
az webapp config appsettings set --resource-group eventful-platform-prod --name eventful-api --settings KEY="value"

# Delete everything (CAREFUL!)
az group delete --name eventful-platform-prod --yes --no-wait
```

---

## ✅ Deployment Checklist

- [ ] Azure CLI installed and logged in
- [ ] Resource group created in UK South
- [ ] App Service created and running
- [ ] PostgreSQL server created
- [ ] Database created
- [ ] Firewall rules configured
- [ ] Environment variables set
- [ ] Application built successfully
- [ ] Code deployed to Azure
- [ ] Database migrations run
- [ ] Application accessible at URL
- [ ] API endpoints working
- [ ] Health check passing
- [ ] Logs configured and viewable

---

**🎉 Congratulations! Your Eventful Platform is now live on Azure!**

For support, check the logs first, then review the troubleshooting section.
