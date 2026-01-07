# Lavender Moon Villas

A boutique luxury villa booking platform with a front desk reservation system, built with Next.js and Neon PostgreSQL.

## 🌙 Live Site

**Production Website**: [Deployed on Vercel from `main` branch]  
**Staging Website**: [Deployed on Vercel from `staging` branch] - For client testing (Preview deployment)  
**Location**: Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica

## 🌿 Branch Strategy

This project uses a two-branch strategy:

- **`main` branch**: Production deployment with the original static HTML landing page
  - Stable, public-facing website
  - Contains only the landing page (index.html)
  - Deployed to production URL

- **`staging` branch**: Testing/development environment with full Next.js reservation system
  - Full-featured application with dashboard and reservation system
  - All Phase 2 & 3 features included
  - Deployed to staging URL for client testing
  - Used for development and client approval before merging to main

### Development Workflow

1. **Feature Development**: Work on feature branches or directly on `staging`
2. **Client Testing**: Deploy to staging branch → Client tests at staging URL
3. **Production Release**: Merge `staging` → `main` when ready to update production

**Note**: Currently, `main` remains as the static landing page. When ready to update production, merge `staging` into `main`.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Neon PostgreSQL database (or use the existing one)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials
# The database connection string is already configured for the Neon project

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### First Time Setup

1. **Access the dashboard**: Navigate to `/dashboard/login`
2. **Login with default credentials** (see Staff Login section below)
3. **Create your first reservation** to test the system
4. **Update admin password** for security

## 🔐 Staff Login

Access the front desk dashboard at `/dashboard`

**Default Admin Credentials:**
- Email: `admin@lavendermoonvilla.com`
- Password: `admin123`

⚠️ **Change these credentials in production!**

## 🗄️ Database

This project uses **Neon PostgreSQL** for the database.

### Schema

**Tables:**
- `rooms` - Room inventory with pricing and status
- `guests` - Guest information
- `reservations` - Booking records
- `staff` - Front desk staff authentication

### Neon Project Details
- Project ID: `curly-block-95949825`
- Database: `neondb`
- Region: `us-east-1`

### Database Migrations

To add payment tracking columns to the reservations table (required for WiPay integration):

```bash
DATABASE_URL=your_connection_string node scripts/add-payment-columns.mjs
```

This will add the following columns:
- `payment_reference` - Payment order reference
- `payment_status` - Payment status (paid, failed, etc.)
- `payment_transaction_id` - DimePay transaction ID
- `payment_date` - Payment completion timestamp

**Note:** The application will work without these columns, but payment tracking information won't be stored.

## 📁 Project Structure

```
├── public/
│   ├── Pictures/          # Property images
│   ├── favicon.png
│   └── apple-touch-icon.png
├── src/
│   ├── app/
│   │   ├── page.tsx       # Landing page
│   │   ├── dashboard/     # Staff dashboard
│   │   │   ├── page.tsx
│   │   │   ├── login/
│   │   │   └── DashboardClient.tsx
│   │   └── api/           # API routes
│   │       ├── auth/      # Authentication endpoints
│   │       ├── rooms/     # Room management
│   │       ├── guests/    # Guest management
│   │       └── reservations/  # Reservation CRUD & check-in/out
│   ├── components/
│   │   ├── ReservationForm.tsx    # Booking form component
│   │   ├── AvailabilityCalendar.tsx  # Calendar view
│   │   └── Stars.tsx      # Animated stars for hero
│   └── lib/
│       ├── db.ts          # Database connection & types
│       └── auth.ts        # Authentication utilities
├── package.json
└── tailwind.config.ts
```

## 🎨 Design System

### Colors
- **Lavender Deep**: `#4a3f6b`
- **Lavender Medium**: `#7c6a9a`
- **Lavender Soft**: `#b8a9c9`
- **Moon Gold**: `#d4af37`
- **Night Dark**: `#1a1425`
- **Moon Cream**: `#f5f0e8`

### Typography
- **Headings**: Cormorant Garamond (serif)
- **Body**: Montserrat (sans-serif)

## ✨ Features

### Phase 2 - Backend Integration ✅
- ✅ Beautiful responsive landing page
- ✅ Next.js 14 with App Router
- ✅ Neon PostgreSQL database
- ✅ Staff authentication (JWT)
- ✅ Front desk dashboard
- ✅ Room status management
- ✅ Reservation viewing

### Phase 3 - Reservation System ✅
- ✅ Create/edit reservations with full guest information
- ✅ Real-time availability checking
- ✅ Guest check-in/check-out workflow
- ✅ Availability calendar with visual room status
- ✅ Invoice generation (print-ready PDFs)
- ✅ Responsive mobile-friendly dashboard
- ✅ Room status updates (available/occupied/cleaning)
- ✅ Automatic price calculation
- ✅ Guest information management

### Phase 4 - Online Guest Booking Portal ✅ (In Progress)
- ✅ Online guest booking portal with availability checking
- ✅ Public booking API endpoints
- ✅ Multi-step booking process (dates → room selection → guest details → confirmation)
- ✅ Real-time room availability checking
- ✅ Payment integration (DimePay)
- ✅ Email notifications (booking confirmations, updates, cancellations)
- ⏳ Guest account area - Coming next
- ⏳ Booking modification/cancellation by guests - Coming next

### Coming Soon (Phase 5)
- [ ] Advanced reporting and analytics

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon PostgreSQL (serverless)
- **Styling**: Tailwind CSS
- **Authentication**: JWT with jose
- **Password Hashing**: bcryptjs
- **Email Service**: Resend API
- **Payment Gateway**: DimePay
- **Image Optimization**: Next.js Image component
- **Hosting**: Vercel

## 📱 Mobile Support

The dashboard is fully responsive and optimized for:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)

Features include:
- Mobile hamburger menu
- Touch-friendly buttons
- Horizontal scrolling tables
- Responsive grid layouts
- Optimized calendar view

## 📞 Contact

**Lavender Moon Villas**
- 📍 Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica
- 📱 +1 (876) 516-1421
- 💬 WhatsApp: +1 (876) 506-8440
- 📧 reservations@lavendermoon.net

## License

© 2025 Lavender Moon Villas. All rights reserved.
