PRD: SaaS Marketplace Starter Template (Updated)
Project Overview
Build a Next.js 15 + Supabase starter template for selling multiple SaaS services with role-based access, credit system, and admin management capabilities.
Technical Stack

Frontend: Next.js 15 (App Router)
Backend: Supabase (Local instance)
Database: PostgreSQL via Supabase
Authentication: Supabase Auth
Styling: Tailwind CSS
Language: TypeScript

Local Development Setup
Supabase Configuration
env# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWN_ReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
Database Schema Implementation
1. Core Tables
sql-- User profiles extending Supabase auth
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('admin', 'premium', 'free')),
  credits INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Features/Services configuration
CREATE TABLE features (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  required_role TEXT DEFAULT 'free',
  credit_cost INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('grant', 'usage', 'adjustment', 'refund')),
  feature_used TEXT,
  admin_notes TEXT,
  granted_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users
CREATE TABLE admin_users (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  permissions TEXT[] DEFAULT ARRAY['manage_credits', 'manage_users'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User feature unlocks for one-time purchases
CREATE TABLE user_feature_unlocks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  credits_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_name)
);

-- Storage bucket for QR code logo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-logos', 
  'temp-logos', 
  true, 
  5242880, -- 5MB limit
  '["image/png","image/jpeg","image/jpg","image/gif","image/svg+xml","image/webp"]'
)
ON CONFLICT (id) DO NOTHING;
2. Row Level Security (RLS)
sql-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_unlocks ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all transactions" ON credit_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Feature unlocks policies
CREATE POLICY "Users can view own unlocks" ON user_feature_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own unlocks" ON user_feature_unlocks FOR INSERT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all unlocks" ON user_feature_unlocks FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Storage bucket RLS policies
CREATE POLICY "Users can upload their own logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'temp-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view logos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'temp-logos');

CREATE POLICY "Users can delete their own logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'temp-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
Application Structure
1. Project Setup
bashnpx create-next-app@latest saas-starter --typescript --tailwind --eslint --app
cd saas-starter
npm install @supabase/supabase-js @supabase/ssr lucide-react @radix-ui/react-slot class-variance-authority clsx tailwind-merge
2. Directory Structure
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── features/
│   │   ├── profile/
│   │   ├── qr-generator/
│   │   └── custom-qr/
│   ├── admin/
│   │   ├── users/
│   │   ├── credits/
│   │   └── features/
│   ├── api/
│   │   ├── auth/
│   │   ├── credits/
│   │   ├── custom-qr/
│   │   └── webhooks/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── auth/
│   ├── dashboard/
│   ├── admin/
│   └── qr/
├── lib/
│   ├── supabase/
│   ├── simple-custom-qr-service.ts
│   ├── logo-upload-actions.ts
│   ├── feature-unlock-actions.ts
│   ├── utils.ts
│   └── types.ts
└── middleware.ts
Next.js 15 Specific Features to Leverage
1. Enhanced App Router

Server Components by default
Improved streaming and loading states
Better error boundaries

2. React 19 Integration

Use useActionState for form handling
Server Actions for mutations
Enhanced Suspense boundaries

3. Turbopack (Dev Mode)

Faster development builds
Better hot reload performance

Feature Implementation Plan
Phase 1: Core Authentication & Setup

 Supabase client configuration with Next.js 15
 Authentication pages using Server Components
 Protected routes middleware
 User profile creation with Server Actions
 Basic layout with streaming components

Phase 2: User Dashboard

 User dashboard with Suspense boundaries
 Feature listing with Server Components
 Credit transaction history with pagination
 Profile management with optimistic updates
 Feature access gating

Phase 3: Admin Panel

 Admin authentication check
 User management with Server Components
 Credit granting using Server Actions
 Feature configuration interface
 Real-time transaction monitoring

Phase 4: API Routes (Route Handlers)

 Credit validation API using Next.js 15 Route Handlers
 Usage tracking endpoints
 Webhook handlers with improved error handling
 User role management API

Phase 5: QR Code Generator Features

 Simple QR Code Generator (Free)
   - Basic black and white QR codes
   - No credit requirements
   - Instant generation
   - Download functionality

 Custom QR Studio (One-time unlock: 5 credits)
   - Advanced styling options (circles, diamonds, hexagons, rounded squares)
   - Gradient backgrounds (linear and radial)
   - Logo integration with circular clipping
   - Live preview with actual user text
   - Multiple export formats
   - Unlimited generations after unlock
   - Premium/Admin users get automatic access

Phase 6: Advanced Features

 Feature usage analytics with streaming
 Bulk operations with progress indicators
 Real-time notifications
 API documentation with OpenAPI

Key Components to Build
1. Authentication Components (Server + Client)
typescript// Server Component for auth state
async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ...
}

// Client Component for interactive auth
'use client'
function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState)
  // ...
}
2. Dashboard Components with Streaming
typescript// Streaming dashboard with Suspense
function Dashboard() {
  return (
    <div>
      <Suspense fallback={<CreditsSkeleton />}>
        <CreditBalance />
      </Suspense>
      <Suspense fallback={<FeaturesSkeleton />}>
        <FeaturesList />
      </Suspense>
    </div>
  )
}
3. Server Actions for Mutations
typescript// Server Action for credit granting
async function grantCreditsAction(formData: FormData) {
  'use server'
  
  const supabase = await createServerClient()
  // Validate admin permissions
  // Grant credits
  // Return updated state
}

4. QR Code Components
typescript// QR Code Generator Service
class SimpleCustomQRService {
  static async generateCustomQR(options: CustomQROptions): Promise<CustomGeneratedQRCode> {
    // Generate QR with custom styling, gradients, logos
    // Support geometric shapes: circles, diamonds, hexagons
    // Apply gradients while preserving QR data integrity
  }
  
  static drawCustomModule(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, dotType: string, color: string) {
    // Draw individual QR modules as custom shapes
    // Similar to Python's qrcode StyledPilImage with CircleModuleDrawer
  }
}

// Feature unlock system
async function unlockCustomQRStudio() {
  'use server'
  
  // Check existing unlock, deduct credits, create unlock record
  // Premium/Admin users get automatic access
  // Track transaction history
}

// Logo upload with Supabase Storage
async function uploadLogoAction(formData: FormData) {
  'use server'
  
  // Validate file type and size
  // Upload to temp-logos bucket
  // Return base64 data URL for CORS compatibility
}
API Routes Structure (Route Handlers)
Next.js 15 Route Handlers
typescript// app/api/user/credits/route.ts
export async function GET(request: Request) {
  const supabase = await createServerClient()
  // Handle GET request
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  // Handle POST request with improved error handling
}
External Service Integration

POST /api/validate/user - Validate user token
POST /api/credits/deduct - Deduct credits for usage
POST /api/webhooks/payment - Payment webhook handler

Success Criteria
MVP Features

Users can register, login, and manage profiles
Role-based access to different features
Credit system with balance tracking and one-time unlocks
Admin can search users and grant credits
Feature gating based on roles and credits
Transaction history and audit trails

QR Code Features Implemented

✅ Free Simple QR Generator - No credit requirements
✅ Custom QR Studio with one-time unlock system (5 credits)
✅ Advanced dot styling: circles, diamonds, hexagons, rounded squares
✅ Gradient support: linear and radial gradients
✅ Logo integration with file upload and circular clipping
✅ Live preview using actual user text
✅ Canvas-based geometric module drawing system
✅ Supabase Storage integration for logo uploads
✅ Unlimited generations after studio unlock
✅ Premium/Admin automatic access

Next.js 15 Specific Benefits

Improved performance with Turbopack in dev mode
Better streaming with enhanced Server Components
Cleaner form handling with useActionState
Optimized bundle sizes and faster loading
Enhanced error boundaries and loading states

Implementation Order

✅ Initialize Next.js 15 project with latest Supabase integration
✅ Create database schema and run migrations
✅ Build authentication flow using Server Components and Server Actions
✅ Implement streaming dashboard with Suspense boundaries
✅ Create admin panel with real-time capabilities
✅ Add QR Code Generator features:
   - Simple QR Generator (free)
   - Custom QR Studio with one-time unlock system
   - Advanced geometric dot styling system
   - Logo upload with Supabase Storage
   - Live preview with actual user text
✅ Implement feature unlock system with database tracking
✅ Create dashboard feature cards for QR services
Add Route Handlers for external service integration
Optimize performance using Next.js 15 features
Test and deploy with production-ready configuration

Technical Achievements

✅ Canvas-based QR module drawing similar to Python's qrcode StyledPilImage
✅ CORS-compatible image handling with base64 data URLs
✅ Proper geometric shape rendering (circles, diamonds, hexagons)
✅ Gradient overlays while preserving QR code scannability
✅ One-time feature unlock system with credit tracking
✅ Real-time live preview with user content
✅ File upload with validation and storage integration

This updated PRD leverages the latest Next.js 15 features while maintaining the core functionality requirements for your SaaS marketplace starter template.
