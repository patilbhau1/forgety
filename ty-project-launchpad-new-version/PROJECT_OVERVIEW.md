# Project Overview: TyForge

## Purpose

TyForge is a web application designed to assist students with their final year projects. It provides a platform for students to get help with their projects, purchase pre-made projects, or request custom project development.

## Technology Stack

-   **Frontend:**
    -   Framework: React with Vite
    -   Language: TypeScript
    -   UI Components: shadcn-ui
    -   Styling: Tailwind CSS
    -   Routing: React Router DOM
-   **Backend:**
    -   Hybrid architecture:
        1.  **Custom Backend API:** A backend hosted at `https://newtyforge.onrender.com` handles core business logic like user authentication, profile management, and orders. The frontend communicates with it via an Axios client defined in `src/lib/api.ts`.
        2.  **Supabase:** The frontend also connects directly to a Supabase project for specific tasks like handling OAuth callbacks, inserting data, and managing file downloads from Supabase Storage.
-   **State Management:**
    -   Authentication: React Context (`src/contexts/AuthContext.tsx`)
    -   Server State: Likely `@tanstack/react-query` (based on `package.json`)

## Key Architectural Points

-   **Authentication:** The primary authentication flow is managed through the custom backend API, not directly via Supabase Auth. The `AuthContext` handles user sessions.
-   **Routing:** The application uses `react-router-dom` to define public and protected routes. A `ProtectedRoute` component restricts access to authenticated sections like the user dashboard.
-   **API Communication:**
    -   The primary API client is an Axios instance configured in `src/lib/api.ts` to communicate with the custom backend.
    -   A separate Supabase client is initialized in `src/integrations/supabase/client.ts` for direct Supabase operations.
-   **User Flow:**
    -   Unauthenticated users can browse services and pricing on the landing page (`src/pages/Index.tsx`).
    -   After logging in, users are directed to a dashboard (`src/pages/Dashboard.tsx`) where they can manage their profile, view orders, and download project files.
    -   The application includes various pages for different stages of the user journey, such as `ChooseIdeaPath.tsx`, `IdeaGenerator.tsx`, and `PlanSelection.tsx`.

## Project Structure Highlights

-   `src/App.tsx`: Defines the main application layout and routing.
-   `src/pages/`: Contains the top-level page components for each route.
-   `src/components/`: Contains reusable UI components used across different pages.
-   `src/contexts/`: Contains React context providers for managing global state.
-   `src/lib/api.ts`: Centralizes communication with the custom backend.
-   `src/integrations/supabase/client.ts`: Initializes the Supabase client.
