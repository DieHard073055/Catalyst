# SaaS Marketplace Starter Template

A Next.js 15 + Supabase starter template for selling multiple SaaS services with role-based access, credit system, and admin management capabilities.

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Backend**: Supabase (Local instance)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker (for Supabase local development)
- Supabase CLI

### Setup

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Start Supabase locally**
   ```bash
   supabase start
   ```

3. **Run database migrations**
   ```bash
   supabase db push
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

The `.env.local` file is already configured for local Supabase development:

- `NEXT_PUBLIC_SUPABASE_URL`: Local Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous key for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side operations
- `DATABASE_URL`: Direct database connection URL

## Features

### Core Features
- ✅ User authentication (signup/login)
- ✅ Role-based access control (admin, premium, free)
- ✅ Credit system with transaction tracking
- ✅ Admin panel for user and credit management
- ✅ Feature gating based on roles and credits
- ✅ Audit trails for all transactions

### User Roles
- **Free**: Basic access with limited features
- **Premium**: Access to premium features
- **Admin**: Full administrative access

### Database Schema
- `user_profiles`: Extended user information
- `features`: Configurable features/services
- `credit_transactions`: Credit usage and grants tracking
- `admin_users`: Administrative permissions

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # User dashboard
│   ├── admin/           # Admin panel
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   └── admin/           # Admin components
└── lib/
    ├── supabase/        # Supabase client configuration
    ├── types.ts         # TypeScript type definitions
    └── utils.ts         # Utility functions
```

## Development

- Run `npm run dev` to start the development server
- Run `supabase status` to check local Supabase services
- Run `supabase db reset` to reset the database with fresh migrations

## Deployment

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Update environment variables with production values
3. Run migrations on production database
4. Deploy to Vercel, Netlify, or your preferred platform
