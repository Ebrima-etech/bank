# Bank Portal - Deployment Guide

## Overview
This is a Next.js 14 application for bank payment processing. It allows banks to submit and track Hajj payments through an intuitive web interface.

## Prerequisites
- Node.js 18+
- npm or yarn
- Vercel account (for Vercel deployment)
- Access to backend API

## Environment Setup

### Development
```bash
cp .env.example .env.local
# Update API_BASE_URL to your development backend
npm install
npm run dev
```

### Production
1. Copy `.env.example` to `.env.production`
2. Update production API endpoints:
   - `NEXT_PUBLIC_API_BASE_URL` - Production API URL
   - `NEXT_PUBLIC_APP_URL` - Production app domain

## Building for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test production build locally
npm start
```

## Deployment Options

### Option 1: Vercel (Recommended)
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_APP_URL`
3. Deploy: `vercel --prod`

### Option 2: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./next
COPY public ./public
EXPOSE 3001
ENV PORT=3001
CMD ["npm", "start"]
```

### Option 3: Self-Hosted
1. Build: `npm run build`
2. Install PM2: `npm install -g pm2`
3. Start: `pm2 start npm -- start --name "gia-bank" -- -p 3001`

## Security Checklist

- [ ] All sensitive data in `.env.production` (not committed)
- [ ] HTTPS enabled for production
- [ ] CORS properly configured for backend API
- [ ] Authentication tokens handled securely
- [ ] No API keys exposed in client code
- [ ] Payment data never stored locally
- [ ] Content Security Policy headers configured
- [ ] Security headers set (X-Frame-Options, X-Content-Type-Options)
- [ ] CSRF protection enabled
- [ ] Input validation on all forms

## Features for Production

### Payment Processing
- CSV bulk upload validation
- Real-time payment status tracking
- Secure bank authentication
- Audit logs for all transactions

### Performance
- Optimized for high-traffic scenarios
- Efficient data pagination
- Responsive design for mobile banking

## Monitoring

- Monitor API response times
- Track payment success rates
- Monitor error rates and types
- Set up alerts for failures

## Troubleshooting

### Build Failures
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: `node -v` (should be 18+)

### API Connection Issues
- Verify `NEXT_PUBLIC_API_BASE_URL` in environment variables
- Check CORS configuration on backend
- Verify bank authentication endpoints
- Check browser console for detailed errors

### Payment Processing Issues
- Verify backend payment service status
- Check database connectivity
- Monitor payment queue
- Review audit logs

## Rollback Procedure

### Vercel
1. Go to Vercel dashboard
2. Select deployment to revert to
3. Click "Promote to Production"

### Self-Hosted
1. Keep previous build archived
2. Point app server to previous build
3. Restart service with `pm2 restart gia-bank`

## Support
For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- Backend API documentation
- Payment processing logs
- Application error tracking system
