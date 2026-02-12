# AWS EC2 Deployment Guide - Eventful Platform

This guide will help you deploy the Eventful Platform to an AWS EC2 instance in the eu-west-2 (London) region.

## Prerequisites

- AWS Account with EC2 access
- AWS CLI installed and configured (`aws configure`)
- An SSH key pair (.pem file) for EC2 access
- Node.js 18+ installed locally
- Git installed
- Paystack API keys (test or production)

---

## Quick Deployment Steps

1. Launch an EC2 instance
2. SSH into the instance
3. Install Node.js, PM2, PostgreSQL, and Git
4. Clone the repo and configure environment
5. Build and start the application

**Time:** ~30-45 minutes

---

## Manual Deployment (Step-by-Step)

### Step 1: Launch EC2 Instance

Via AWS Console or CLI:

```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c76bd4bd302b30ec \
  --instance-type t2.micro \
  --key-name your-key-pair-name \
  --security-group-ids sg-xxxxxxxxx \
  --region eu-west-2 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=eventful-api}]'
```

**Instance Settings:**
- **AMI**: Amazon Linux 2023 or Ubuntu 22.04
- **Instance Type**: t2.micro (free tier eligible)
- **Region**: eu-west-2 (London)
- **Storage**: 30GB gp3

### Step 2: Configure Security Group

Open the following ports in the EC2 security group:

```bash
# Allow SSH
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

# Allow HTTP
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# Allow HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Allow App Port
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp --port 8080 --cidr 0.0.0.0/0
```

### Step 3: Connect via SSH

```bash
# Set correct permissions on key file
chmod 400 your-key.pem

# SSH into the instance
ssh -i "your-key.pem" bitnami@13.43.80.112
# For Ubuntu: ssh -i "your-key.pem" ubuntu@13.43.80.112
```

### Step 4: Install Dependencies on EC2

```bash
# Update system packages
sudo yum update -y
# For Ubuntu: sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
# For Ubuntu:
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo yum install -y git
# For Ubuntu: sudo apt-get install -y git

# Install PostgreSQL
sudo yum install -y postgresql15-server postgresql15
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
# For Ubuntu:
# sudo apt-get install -y postgresql postgresql-contrib
# sudo systemctl start postgresql
# sudo systemctl enable postgresql
```

### Step 5: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE USER eventfuladmin WITH PASSWORD 'YOUR_SECURE_PASSWORD';
CREATE DATABASE eventful_production OWNER eventfuladmin;
GRANT ALL PRIVILEGES ON DATABASE eventful_production TO eventfuladmin;
\q
```

Update PostgreSQL authentication (pg_hba.conf):

```bash
# Find pg_hba.conf location
sudo -u postgres psql -c "SHOW hba_file;"

# Edit the file to allow password authentication
sudo nano /var/lib/pgsql/data/pg_hba.conf
# Change "ident" to "md5" for local connections

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 6: Clone and Configure the Application

```bash
# Clone the repository
git clone https://github.com/ibraheembello/Eventful-Platform.git
cd Eventful-Platform

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://eventfuladmin:YOUR_SECURE_PASSWORD@localhost:5432/eventful_production
NODE_ENV=production
PORT=8080
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
PAYSTACK_SECRET_KEY=sk_test_your_key
PAYSTACK_PUBLIC_KEY=pk_test_your_key
CLIENT_URL=https://eventful-platform.com
EOF
```

### Step 7: Build the Application

```bash
# Install dependencies (this also triggers build via postinstall)
npm install

# If postinstall didn't run, build manually:
npm run build
npx prisma generate
npx prisma migrate deploy
```

### Step 8: Start with PM2

```bash
# Start the application
pm2 start dist/server.js --name eventful-api

# Save PM2 process list (auto-restart on reboot)
pm2 save

# Set PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

### Step 9: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs eventful-api

# Test health endpoint
curl http://localhost:8080/api/health
```

---

## Security Secrets

Generate secure secrets for JWT:

```bash
# Generate 32-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get two different secrets for ACCESS and REFRESH tokens.

---

## Post-Deployment

### View Application

```
https://eventful-platform.com
```

### View API Documentation

```
https://eventful-platform.com/api/docs
```

### View Logs

```bash
# Stream logs in real-time
pm2 logs eventful-api

# View last 100 lines
pm2 logs eventful-api --lines 100

# View error logs only
pm2 logs eventful-api --err
```

### Check Health

```bash
curl https://eventful-platform.com/api/health
```

---

## Continuous Deployment (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ec2-user/Eventful-Platform
            git pull origin master
            npm install
            pm2 restart eventful-api
```

Add these to GitHub Secrets:
- `EC2_HOST`: `13.43.80.112`
- `EC2_USER`: `ec2-user`
- `EC2_SSH_KEY`: Contents of your .pem file

---

## Troubleshooting

### Application Won't Start

1. Check logs:
   ```bash
   pm2 logs eventful-api --lines 50
   ```

2. Verify environment variables:
   ```bash
   cat .env
   ```

3. Restart app:
   ```bash
   pm2 restart eventful-api
   ```

### Database Connection Issues

1. Check PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Verify DATABASE_URL format

3. Test connection:
   ```bash
   sudo -u postgres psql -d eventful_production -c "SELECT 1;"
   ```

### Frontend Not Loading

1. Verify build succeeded:
   ```bash
   ls -la client/dist
   ```

2. Check NODE_ENV is set to "production"
3. Verify Express static file serving configuration

### Port Already In Use

```bash
# Find process using port 8080
sudo lsof -i :8080
# Or
sudo netstat -tlnp | grep 8080

# Kill the process
kill -9 <PID>
```

---

## Cost Management

### Current Configuration (t2.micro):
- **EC2 Instance**: ~$0/month (free tier) or ~$8-10/month
- **EBS Storage**: ~$2.40/month (30GB gp3)
- **Data Transfer**: ~$1-5/month
- **Total**: ~$3-15/month

### To Reduce Costs:
- Use **t2.micro** (free tier eligible for 12 months)
- Stop instance when not in use
- Use Reserved Instances for long-term savings

### To Stop Instance (save costs):
```bash
aws ec2 stop-instances --instance-ids <instance-id>
```

### To Start Instance:
```bash
aws ec2 start-instances --instance-ids <instance-id>
```

---

## Setting Up a Friendly URL

Your app currently runs at `https://eventful-platform.com` (raw IP). To get a friendly URL:

### Option 1: Elastic IP (Prevents IP Changes)
```bash
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc

# Associate with your instance
aws ec2 associate-address --instance-id <instance-id> --allocation-id <eip-alloc-id>
```

### Option 2: Custom Domain (Route 53)
1. Register a domain on Route 53 or any registrar
2. Create an A record pointing to your EC2 public IP
3. Set up Nginx + Let's Encrypt for HTTPS

### Option 3: Nginx Reverse Proxy + SSL
```bash
# Install Nginx
sudo yum install -y nginx
# For Ubuntu: sudo apt-get install -y nginx

# Configure Nginx
sudo nano /etc/nginx/conf.d/eventful.conf
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Certbot for SSL
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | Yes | Set to "production" |
| `PORT` | Yes | Set to "8080" |
| `JWT_ACCESS_SECRET` | Yes | 32+ character secret |
| `JWT_REFRESH_SECRET` | Yes | 32+ character secret |
| `PAYSTACK_SECRET_KEY` | Yes | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | Yes | Paystack public key |
| `CLIENT_URL` | Yes | Your app URL |
| `REDIS_URL` | Optional | Redis connection (if using) |

---

## Useful Commands

```bash
# SSH into EC2
ssh -i "your-key.pem" bitnami@13.43.80.112

# Deploy latest changes
cd /home/ec2-user/Eventful-Platform && git pull origin master && npm install && pm2 restart eventful-api

# View PM2 processes
pm2 status

# View logs
pm2 logs eventful-api

# Monitor resources
pm2 monit

# Restart application
pm2 restart eventful-api

# Stop application
pm2 stop eventful-api

# Delete PM2 process
pm2 delete eventful-api

# Check EC2 instance status
aws ec2 describe-instances --instance-ids <instance-id> --query 'Reservations[0].Instances[0].State.Name'

# Stop instance (save costs)
aws ec2 stop-instances --instance-ids <instance-id>

# Start instance
aws ec2 start-instances --instance-ids <instance-id>
```

---

## Deployment Checklist

- [ ] EC2 instance launched in eu-west-2
- [ ] Security group configured (ports 22, 80, 443, 8080)
- [ ] SSH key pair created and saved
- [ ] Node.js 20 installed on EC2
- [ ] PM2 installed globally
- [ ] PostgreSQL installed and configured
- [ ] Database and user created
- [ ] Repository cloned on EC2
- [ ] Environment variables configured (.env)
- [ ] Application built successfully
- [ ] PM2 process started
- [ ] Application accessible at public IP
- [ ] API endpoints working
- [ ] Health check passing
- [ ] PM2 startup configured (auto-restart on reboot)

---

**Your Eventful Platform is now live on AWS EC2!**

For support, check the PM2 logs first, then review the troubleshooting section.
