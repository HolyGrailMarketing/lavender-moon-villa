# Lavender Moon Villa

A boutique luxury villa booking platform with a front desk reservation system, built with Next.js and Neon PostgreSQL.

## 🌙 Live Site

**Website**: [Deployed on Vercel]
**Location**: Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica

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

### Coming Soon (Phase 4 & 5)
- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Online guest booking portal
- [ ] Guest account area
- [ ] Booking modification/cancellation by guests
- [ ] Advanced reporting and analytics

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon PostgreSQL (serverless)
- **Styling**: Tailwind CSS
- **Authentication**: JWT with jose
- **Password Hashing**: bcryptjs
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

**Lavender Moon Villa**
- 📍 Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica
- 📱 +1 (876) 516-1421
- 📧 hello@lavendermoonvilla.com

## License

© 2025 Lavender Moon Villa. All rights reserved.
