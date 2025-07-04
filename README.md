# Healthcare SaaS Platform

A modern, full-stack healthcare management system built with Next.js and Node.js, designed for seamless patient appointment booking and healthcare provider management.

![Healthcare Platform](https://res.cloudinary.com/dws2bgxg4/image/upload/v1732731462/healthcare-banner.jpg)

## 🚀 Features

### Patient Features
- **Appointment Booking**: Easy online appointment scheduling with multiple appointment types
- **Patient Registration**: Secure patient registration with medical information
- **Appointment Status**: Real-time appointment status tracking
- **User-Friendly Interface**: Intuitive design with dark/light theme support
- **Forgot User ID**: Quick recovery system for existing patients

### Admin Features
- **Admin Dashboard**: Comprehensive appointment management system
- **Patient Management**: View and manage patient information
- **Analytics**: Dashboard with appointment statistics and insights
- **Secure Authentication**: Protected admin access with OTP verification
- **Appointment Actions**: Schedule, cancel, and update appointments

### Technical Features
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live appointment status updates
- **File Upload**: Secure document and image upload with Cloudinary
- **Email Notifications**: Automated email confirmations and updates
- **Payment Integration**: Stripe payment processing (ready for implementation)
- **Security**: Rate limiting, input validation, and secure authentication

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks and context
- **Theme**: Next-themes for dark/light mode
- **File Upload**: React Dropzone with Cloudinary integration

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt hashing
- **File Storage**: Cloudinary for images and documents
- **Email**: Sendinblue (Brevo) for transactional emails
- **Logging**: Winston for application logging
- **Security**: Rate limiting, XSS protection, and input sanitization

### DevOps & Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Environment**: Environment variables for configuration
- **Process Management**: PM2 ready for production deployment
- **Health Checks**: Built-in health monitoring endpoints

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB database
- Cloudinary account for file storage
- Sendinblue (Brevo) account for email services
- Git for version control

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd healthcare
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp env.example .env
# Edit .env with your configuration values
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create environment file (if needed)
# Add any frontend-specific environment variables
```

### 4. Environment Configuration

#### Backend Environment Variables (.env)
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (Sendinblue/Brevo)
SENDINBLUE_API_KEY=your_sendinblue_api_key
FROM_EMAIL=your_sender_email

# Application
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Admin
ADMIN_PASSKEY=your_admin_passkey
```

#### Frontend Environment Variables (.env.local)
```env
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Admin
NEXT_PUBLIC_ADMIN_PASSKEY=your_admin_passkey

# Cloudinary (for direct uploads if needed)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

## 🏃‍♂️ Running the Application

### Development Mode

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Mode

#### Backend
```bash
cd backend
npm run start:production
```

#### Frontend
```bash
cd frontend
npm run build
npm run start:production
```

## 📁 Project Structure

```
healthcare/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages and layouts
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── api/            # API route handlers
│   │   ├── book-appointment/ # Appointment booking
│   │   ├── existing-patient/ # Patient portal
│   │   ├── register/       # Patient registration
│   │   └── success/        # Success pages
│   ├── components/         # Reusable UI components
│   │   ├── forms/         # Form components
│   │   ├── table/         # Table components
│   │   └── ui/            # Base UI components
│   ├── constants/         # Application constants
│   ├── lib/              # Utility functions and API calls
│   ├── public/           # Static assets
│   ├── scripts/          # Deployment scripts
│   └── types/            # TypeScript type definitions
├── backend/                 # Node.js backend application
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── logs/              # Application logs
│   └── server.js          # Main server file
└── README.md              # Project documentation
```

## 🔗 API Endpoints

### Public Endpoints
- `POST /api/auth/register` - Patient registration
- `POST /api/auth/verify-existing-patient` - Verify existing patient
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/user/:userId` - Get user appointments
- `POST /api/forgot-user-id` - Forgot User ID recovery

### Admin Endpoints
- `POST /api/admin/verify` - Admin login verification
- `GET /api/appointments` - Get all appointments (admin)
- `PUT /api/appointments/:id` - Update appointment status
- `GET /api/analytics/dashboard` - Get dashboard analytics

### Health Check
- `GET /api/health` - Application health status

## 🎨 UI Components

The application uses a modern component library built on:
- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Custom Components**: Form fields, tables, modals, and more

## 🔒 Security Features

- **Input Validation**: Zod schema validation on frontend and backend
- **XSS Protection**: Input sanitization and output encoding
- **Rate Limiting**: API rate limiting to prevent abuse
- **Secure Authentication**: JWT tokens with secure storage
- **Environment Security**: Sensitive data in environment variables
- **File Upload Security**: Validated file uploads with Cloudinary

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices
- Various screen sizes and orientations

## 🌙 Theme Support

Built-in dark and light theme support with:
- System preference detection
- Manual theme switching
- Persistent theme selection
- Smooth theme transitions

## 📧 Email Features

Automated email notifications for:
- Appointment confirmations
- Appointment status updates
- User ID recovery
- Admin notifications

## 🚀 Deployment

### PM2 (Recommended for Backend)
```bash
cd backend
npm run pm2:start
```

### Docker (Optional)
Docker configuration can be added for containerized deployment.

### Cloud Deployment
The application is ready for deployment on:
- Vercel (Frontend)
- Railway/Render (Backend)
- AWS/Google Cloud/Azure

## 🔧 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Backend
- `npm run dev` - Start development server with nodemon
- `npm run start` - Start production server
- `npm run start:production` - Start with production environment
- `npm run pm2:start` - Start with PM2 process manager
- `npm run health-check` - Check application health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🎯 Future Enhancements

- [ ] Payment processing integration
- [ ] SMS notifications
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Video consultation features
- [ ] Mobile app development
- [ ] Integration with electronic health records (EHR)

---

**Built with ❤️ for modern healthcare management**
