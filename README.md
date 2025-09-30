# Healthcare Management System - Frontend

A modern, responsive healthcare management system built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Patient Registration & Management**
- **Appointment Booking System**
- **Admin Dashboard**
- **Appointment Status Tracking**
- **Responsive Design**
- **Dark/Light Mode Support**
- **Real-time Updates**

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **State Management**: React Hooks

## 📦 Production Deployment

### Prerequisites
- Node.js 18.17 or later
- npm or yarn package manager

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env.production
```

2. Update the production environment variables:
```bash
# Backend API URL (your production backend)
NEXT_PUBLIC_API_URL=https://your-backend-domain.com

# App branding
NEXT_PUBLIC_APP_NAME=Your Clinic Name
NEXT_PUBLIC_APP_DESCRIPTION=Healthcare management system

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Build & Deploy

1. Install dependencies:
```bash
npm install --production
```

2. Build the application:
```bash
npm run build:production
```

3. Start the production server:
```bash
npm run start:production
```

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuration

### Backend Integration
The frontend connects to a separate backend API. Ensure your backend is running and accessible at the URL specified in `NEXT_PUBLIC_API_URL`.

### Admin Access
- Default admin route: `/admin/login`
- Configure admin passkey in backend environment

### Health Check
- Health endpoint: `/api/health`
- Provides frontend status and backend connectivity

## 📱 Routes

### Public Routes
- `/` - Homepage
- `/register` - Patient registration
- `/existing-patient` - Existing patient verification
- `/book-appointment` - Appointment booking
- `/appointment-status` - Check appointment status
- `/success` - Booking confirmation

### Admin Routes
- `/admin/login` - Admin authentication
- `/admin` - Admin dashboard
- `/admin/appointments/[id]` - Appointment details

## 🔒 Security Features

- **JWT Authentication** for admin routes
- **Input Validation** with Zod schemas
- **Rate Limiting** on sensitive endpoints
- **CSRF Protection**
- **Secure Headers**

## 🎨 Customization

### Branding
Update the following files for custom branding:
- `tailwind.config.ts` - Color scheme
- `public/assets/icons/` - Logo and icons
- `constants/index.ts` - App constants

### Styling
The application uses Tailwind CSS with custom design tokens:
- Custom color palette for healthcare theme
- Responsive breakpoints
- Dark mode support
- Animation utilities

## 📊 Monitoring

### Health Checks
- Frontend health: `GET /api/health`
- Includes backend connectivity status
- Returns system information and configuration

### Performance
- Built-in Next.js analytics
- Image optimization enabled
- Static generation where possible
- Bundle analysis available with `npm run analyze`

## 🛡️ Production Checklist

Before deploying to production, ensure:

- [ ] Environment variables are configured
- [ ] Backend API is accessible
- [ ] SSL certificates are installed
- [ ] Database connections are secure
- [ ] Admin passkeys are changed from defaults
- [ ] Error monitoring is configured
- [ ] Backup systems are in place
- [ ] Security headers are configured

## 🔄 Updates & Maintenance

### Updating Dependencies
```bash
npm audit
npm update
npm run build
npm test
```

### Database Migrations
Coordinate with backend team for database schema changes.

### Backup Strategy
- Regular backups of user data
- Configuration backups
- Asset backups (images, uploads)

## 🆘 Troubleshooting

### Common Issues

1. **Build Errors**
   - Check Node.js version compatibility
   - Clear `.next` cache: `npm run clean`
   - Verify all dependencies are installed

2. **API Connection Issues**
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check backend server status
   - Review CORS configuration

3. **Performance Issues**
   - Enable image optimization
   - Check bundle size
   - Review loading strategies

### Support
For technical support or questions:
- Check documentation
- Review logs in `/var/log/` (server deployments)
- Contact development team

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for healthcare applications.
