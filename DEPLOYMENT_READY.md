# Deployment Ready - Eventful Platform

## Your Application is Deployed on AWS EC2!

The Eventful Platform is running on an AWS EC2 instance in the **eu-west-2 (London)** region.

---

## What's Been Done

### Code Changes
- [x] Backend configured to serve React frontend in production
- [x] Build scripts updated for combined frontend + backend deployment
- [x] API client configured for production URLs
- [x] Express static file serving added
- [x] Production environment detection implemented
- [x] Redis made optional for environments without it

### Infrastructure
- [x] EC2 instance launched in eu-west-2 (London)
- [x] Security group configured (ports 22, 80, 8080)
- [x] Node.js 20 LTS installed
- [x] PM2 process manager installed
- [x] PostgreSQL configured
- [x] Application built and running

### Features Working
- [x] Authentication & Authorization
- [x] Event Management
- [x] Ticket Generation & QR Codes
- [x] Ticket Verification
- [x] Payment Integration (Paystack)
- [x] Analytics Dashboard
- [x] Reminders System
- [x] Dark Mode
- [x] Social Sharing

---

## Live URLs

- **Frontend**: https://eventful-platform.com
- **API**: https://eventful-platform.com/api
- **Events**: https://eventful-platform.com/events
- **Health Check**: https://eventful-platform.com/api/health
- **API Docs**: https://eventful-platform.com/api/docs

---

## Deploying Updates

### Quick Deploy (on EC2 via SSH)

```bash
ssh -i "your-key.pem" bitnami@13.43.80.112
cd /home/ec2-user/Eventful-Platform
git pull origin master
npm install
pm2 restart eventful-api
```

**What this does:**
1. Pulls latest code from GitHub
2. Installs dependencies and builds (via postinstall)
3. Restarts the application

**Duration:** ~5-10 minutes

---

## Information You'll Need

1. **SSH Key**: Your .pem file for EC2 access
2. **Static IP**: 13.43.80.112
3. **PostgreSQL Password**: Set during initial setup
4. **Paystack Keys**: From https://dashboard.paystack.com
5. **JWT Secrets**: Generated random strings

### Generate JWT Secrets

Run this twice for two secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Managing the Application

### View Logs

```bash
pm2 logs eventful-api
```

### Restart Application

```bash
pm2 restart eventful-api
```

### Stop Application

```bash
pm2 stop eventful-api
```

### Check Status

```bash
pm2 status
```

---

## Tips

1. **First deployment is complete** - subsequent updates are faster (~5 min)

2. **Cold Start**
   - First request after idle may take a few seconds
   - PM2 keeps the app running, so cold starts are rare

3. **Database Migrations**
   - Automatically run during `npm install` (via postinstall)
   - Check logs if migrations fail

4. **Environment Variables**
   - Stored in `.env` file on EC2
   - Never committed to Git

5. **Cost Management**
   - t2.micro is free tier eligible
   - Stop the instance when not needed to save costs

---

## Security Checklist

- [x] All secrets in environment variables (not in code)
- [x] Security group restricts access
- [x] JWT tokens properly secured
- [x] CORS configured correctly
- [x] Rate limiting enabled
- [x] Helmet security headers applied
- [ ] Set up HTTPS with SSL (recommended)
- [ ] Restrict SSH to your IP only (recommended)

---

## Monitoring

### Check Application Status

```bash
pm2 status
```

### View Resource Usage

```bash
pm2 monit
```

### Check EC2 Instance

```bash
aws ec2 describe-instances --instance-ids <instance-id> --query 'Reservations[0].Instances[0].State.Name'
```

---

## Troubleshooting

### App Not Responding?
```bash
# Check PM2 status
pm2 status
# Check logs
pm2 logs eventful-api --lines 50
# Restart
pm2 restart eventful-api
```

### Database Connection Failed?
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# Restart if needed
sudo systemctl restart postgresql
```

### Out of Memory?
```bash
# Check memory usage
free -m
# Restart PM2 to free memory
pm2 restart all
```

---

## What You've Achieved

- Full-stack event ticketing platform
- Production-ready architecture
- Secure payment processing
- QR code ticket system
- Analytics dashboard
- Deployed on AWS EC2
- Professional documentation

---

## Need Help?

- **AWS EC2 Documentation:** https://docs.aws.amazon.com/ec2/
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/
- **Project Issues:** Check AWS_DEPLOYMENT_GUIDE.md

---

## Quick Reference Card

```bash
# SSH into EC2
ssh -i "your-key.pem" bitnami@13.43.80.112

# Deploy updates
cd /home/ec2-user/Eventful-Platform && git pull origin master && npm install && pm2 restart eventful-api

# View logs
pm2 logs eventful-api

# Restart
pm2 restart eventful-api

# Stop app
pm2 stop eventful-api

# Stop EC2 (save costs)
aws ec2 stop-instances --instance-ids <instance-id>

# Start EC2
aws ec2 start-instances --instance-ids <instance-id>
```

---

**Built for AltSchool Africa Final Semester Project**
