# TY Project Launchpad - AI Agents Documentation

## Project Overview

This is a modern React-based web application called "TY Project Launchpad" - a platform designed to help final year engineering students generate, manage, and track their project ideas. The application uses AI-powered idea generation through Google's Gemini API and provides a comprehensive project management system with Supabase backend integration.

**Key Features:**
- AI-powered project idea generation based on student interests
- User authentication and project tracking
- Responsive design with mobile-first approach
- Interactive chatbot interface for project guidance
- Project submission and approval workflow

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4.1 with SWC for fast compilation
- **Routing**: React Router DOM v6
- **State Management**: React Query (TanStack Query) for server state
- **Styling**: Tailwind CSS with custom theme configuration
- **UI Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React & React Icons
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Toast Notifications**: Sonner for modern notifications

### Backend & Database
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth
- **API Integration**: Google Gemini API for AI idea generation
- **HTTP Client**: Axios for API requests

### Development Tools
- **Linting**: ESLint with TypeScript support
- **TypeScript**: Strict mode disabled, allowing JS files
- **Development**: Lovable.dev integration for AI-assisted development

## Project Structure

```
src/
├── assets/                 # Static assets (images, fonts)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Header.tsx        # Navigation header
│   ├── Footer.tsx        # Site footer
│   ├── Chatbot.tsx       # AI chatbot interface
│   └── BottomNavigation.tsx # Mobile navigation
├── hooks/                 # Custom React hooks
│   ├── use-mobile.tsx    # Mobile detection
│   └── useScrollToTop.tsx # Scroll behavior
├── integrations/          # Third-party integrations
│   └── supabase/         # Supabase client and types
├── lib/                   # Utility functions
│   └── utils.ts          # Tailwind merge utilities
├── pages/                 # Route components
│   ├── Index.tsx         # Landing page
│   ├── IdeaGenerator.tsx # AI idea generation
│   ├── Dashboard.tsx     # User dashboard
│   ├── Login.tsx         # Authentication
│   └── [others]          # Additional pages
└── styles/               # Global CSS files
```

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Configuration Files

### Vite Configuration (`vite.config.ts`)
- Development server runs on port 8080
- Path aliases configured (`@` → `./src`)
- Lovable.dev component tagger in development mode

### TypeScript Configuration
- Main config in `tsconfig.json` with project references
- Relaxed strictness settings for faster development
- Path mapping for `@/*` imports

### Tailwind Configuration (`tailwind.config.ts`)
- Custom color scheme with CSS variables
- Extended font families: Bricolage Grotesque, Poppins, Feasibly
- Custom animations and box shadows
- Dark mode support via class strategy

### shadcn/ui Configuration (`components.json`)
- Default styling approach
- TypeScript with TSX support
- Path aliases for components, utils, hooks, and lib

## Key Features Implementation

### AI Idea Generation
- Integration with Google Gemini API
- Fallback idea generation when API unavailable
- Form-based input collection (name, phone, interests)
- Generated ideas stored in Supabase database

### Authentication System
- Supabase Auth integration
- Protected routes for authenticated users
- Session management with proper redirects

### Database Schema
**Primary Table: `ideas`**
- `id`: Primary key (auto-increment)
- `created_at`: Timestamp
- `name`: Student name
- `phoneno`: Contact number
- `interests`: Area of interest
- `idea`: Generated project idea

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Bottom navigation for mobile devices
- Custom mobile CSS improvements
- Touch-friendly UI components

## Environment Variables

Create a `.env` file with:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_API_URI=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
VITE_SUPABASE_KEY=your_supabase_anon_key
```

## Deployment

### Vercel Deployment
- SPA routing configured via `vercel.json`
- All routes redirect to `index.html`
- Ready for Vercel deployment out of the box

### Lovable.dev Integration
- Project created and managed through Lovable.dev
- Automatic commits from Lovable platform
- AI-assisted development capabilities

## Code Style Guidelines

### Component Structure
- Functional components with TypeScript
- Custom hooks for reusable logic
- Proper prop typing with interfaces
- Consistent import organization

### Styling Conventions
- Tailwind utility classes preferred
- Custom CSS only when necessary
- CSS variables for theme consistency
- Mobile-first responsive design

### Naming Conventions
- PascalCase for React components
- camelCase for functions and variables
- kebab-case for CSS classes
- Descriptive, self-documenting names

## Testing Strategy

Currently, the project does not include automated tests. Manual testing should focus on:
- Cross-browser compatibility
- Mobile responsiveness
- Form validation and error handling
- API integration fallbacks
- Authentication flows

## Security Considerations

### API Keys
- Frontend API keys are exposed (standard for client-side apps)
- Consider implementing proxy endpoints for sensitive operations
- Rate limiting should be implemented on API endpoints

### Data Validation
- Client-side validation with React Hook Form and Zod
- Server-side validation through Supabase Row Level Security
- Input sanitization for user-generated content

### Authentication
- Supabase Auth provides secure authentication
- Session management handled automatically
- Protected routes implemented

## Performance Optimization

### Bundle Optimization
- Vite's built-in code splitting
- Dynamic imports for heavy components
- Tree shaking enabled

### Image Optimization
- Proper image formats and sizing
- Lazy loading for below-fold content

### Runtime Performance
- React Query for efficient data fetching
- Proper memoization where needed
- Virtual scrolling for large lists

## Known Limitations

1. No automated testing framework implemented
2. API keys exposed in frontend (standard for this architecture)
3. Limited error boundary implementation
4. No offline functionality
5. Basic SEO implementation (SPA limitations)

## Development Workflow

1. **Local Development**: Use `npm run dev` for hot-reload development
2. **Lovable Integration**: Changes can be made through Lovable.dev interface
3. **Git Workflow**: Standard Git workflow with automatic Lovable commits
4. **Deployment**: Automatic deployment through Vercel integration

## Troubleshooting Common Issues

### Build Failures
- Check TypeScript errors (project uses relaxed settings)
- Verify all dependencies are installed
- Check for circular dependencies

### API Integration Issues
- Verify environment variables are set
- Check API rate limits
- Review fallback mechanisms

### Styling Issues
- Ensure Tailwind classes are properly applied
- Check for CSS specificity conflicts
- Verify responsive breakpoints

This documentation serves as a comprehensive guide for AI agents working on this project. Refer to specific file contents for implementation details.