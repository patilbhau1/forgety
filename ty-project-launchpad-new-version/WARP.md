# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Setup and Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
# Runs on port 8080 (configured in vite.config.ts)
```

### Build Commands
```bash
npm run build          # Production build
npm run build:dev      # Development build
npm run preview        # Preview production build
```

### Code Quality
```bash
npm run lint           # Run ESLint
```

**Note:** This project does not currently have automated tests. Manual testing is required.

## Architecture Overview

### Dual Backend Architecture
This project uses a **hybrid backend approach** - understand this before making API-related changes:

1. **Custom Backend API** (`https://newtyforge.onrender.com`)
   - Handles core business logic: authentication, user management, orders
   - All requests go through Axios client (`src/lib/api.ts`)
   - Uses JWT token stored in localStorage
   - Token automatically injected via Axios interceptor

2. **Supabase** (Direct connection)
   - Used for OAuth callbacks, specific data operations, and file storage
   - Client initialized in `src/integrations/supabase/client.ts`
   - **Important:** Authentication is NOT through Supabase Auth - it's through the custom backend

### Authentication Flow
- **Primary auth:** Custom backend API, not Supabase Auth
- Auth state managed via React Context (`src/contexts/AuthContext.tsx`)
- JWT token stored in localStorage, automatically attached to API requests
- `ProtectedRoute` component wraps authenticated routes
- Cross-tab logout detection via localStorage events

### Routing Structure
- Public routes: landing page, login, signup, projects, past work, idea generator, contact
- Protected routes: dashboard, orders, synopsis, black-book, meet, plan selection, project setup, admin help, idea path selection
- Protected routes redirect to `/login` when unauthenticated
- Login redirect-after-auth preserves intended destination

### State Management
- **Authentication:** React Context (`AuthContext`)
- **Server state:** TanStack Query (React Query)
- **Local state:** React hooks

### UI Architecture
- **Components:** shadcn/ui with Radix UI primitives
- **Styling:** Tailwind CSS with custom theme
- **Custom fonts:** Bricolage Grotesque, Poppins, Feasibly (defined in tailwind.config.ts)
- **Mobile navigation:** Bottom navigation component for mobile views
- **Notifications:** Sonner for toast notifications

### Key Directories
- `src/pages/` - Route-level components
- `src/components/` - Reusable UI components (including `ui/` for shadcn components)
- `src/contexts/` - React Context providers
- `src/lib/api.ts` - Axios client for custom backend API
- `src/integrations/supabase/` - Supabase client and types
- `src/hooks/` - Custom React hooks

### Important Configuration Files
- `vite.config.ts` - Dev server on port 8080, path aliases (`@` → `./src`)
- `tailwind.config.ts` - Custom theme, fonts, animations
- `components.json` - shadcn/ui configuration
- `vercel.json` - SPA routing for Vercel deployment

## Environment Variables

Required environment variables (create `.env` file):
```env
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key  # For AI idea generation
VITE_GEMINI_API_URI=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

## Project Context

**Purpose:** TyForge is a platform for final year engineering students to get help with projects, purchase pre-made projects, or request custom project development.

**Tech Stack:**
- React 18 + TypeScript
- Vite with SWC
- React Router DOM v6
- Tailwind CSS + shadcn/ui
- Framer Motion for animations
- React Hook Form + Zod for form validation

## Important Notes

### When Working with API Calls
- **Always** use the `api` client from `src/lib/api.ts` for custom backend calls
- Auth token is automatically injected - don't manually add Authorization headers
- For Supabase operations, use the `supabase` client from `src/integrations/supabase/client.ts`

### When Working with Authentication
- Auth flows through custom backend, **not** Supabase Auth
- Check `AuthContext` for user state, don't query Supabase Auth directly
- Token management is handled by `AuthContext` - don't manipulate localStorage directly except through auth methods

### When Adding Protected Routes
- Add route to `protectedRoutes` array in `App.tsx`
- Routes automatically get `ProtectedRoute` wrapper
- Unauthenticated users redirect to `/login`

### When Working with Forms
- Use React Hook Form + Zod for validation (already installed)
- shadcn/ui form components are available in `src/components/ui/`

### When Styling Components
- Prefer Tailwind utility classes
- Use custom CSS variables defined in theme (check `tailwind.config.ts`)
- Mobile-first responsive design approach
- Custom breakpoints and animations available

### TypeScript Configuration
- Relaxed strictness settings (not strict mode)
- JS files are allowed
- Path alias: `@/*` maps to `src/*`

## Deployment

**Primary:** Vercel (SPA routing configured in `vercel.json`)
**Alternative:** Lovable.dev platform integration available
