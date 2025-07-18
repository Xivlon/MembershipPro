# Luggsters Membership Portal

## Overview

This is a full-stack web application for Luggsters, a travel luggage protection service. The application allows users to select and purchase membership plans with secure payment processing. Built as a modern React application with TypeScript and Express.js backend.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React 18 with TypeScript, using Vite for build tooling and development
- **Backend**: Express.js with TypeScript, serving both API endpoints and static files
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design system
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui components built on Radix UI primitives for accessibility
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **UI Framework**: Tailwind CSS with custom CSS variables for theming
- **Build System**: Vite with React plugin and development error overlay
- **Asset Management**: Static asset handling with path aliases

### Backend Architecture
- **API Layer**: RESTful Express.js endpoints with TypeScript
- **Data Layer**: Drizzle ORM with PostgreSQL adapter (@neondatabase/serverless)
- **Storage Abstraction**: Interface-based storage layer supporting multiple implementations
- **Request Validation**: Zod schemas for API request/response validation
- **Development Integration**: Vite middleware for hot module replacement

### Database Schema
The application uses three main database tables:
- **users**: Basic user authentication (username/password)
- **membership_plans**: Plan details including pricing, features, and validity periods
- **payments**: Payment records with cardholder information, subscription tracking, and status
  - Added `stripeSubscriptionId` and `stripeCustomerId` fields for subscription management
  - Status values: 'pending', 'active', 'cancelled', 'failed'

## Data Flow

1. **Plan Selection**: Client fetches available membership plans from `/api/membership-plans`
2. **Plan Details**: Individual plan details retrieved via `/api/membership-plans/:id`
3. **Subscription Processing**: User submits payment form to `/api/payments` with validation
4. **Form Validation**: Client-side validation using React Hook Form + Zod
5. **Server Validation**: Server-side validation using shared Zod schemas
6. **Stripe Integration**: Creates customers, products, prices, and subscriptions
7. **Storage**: Payment records stored with subscription IDs and status tracking
8. **Webhook Handling**: `/api/webhook` endpoint processes subscription events

## External Dependencies

### Core Infrastructure
- **@neondatabase/serverless**: Serverless PostgreSQL driver for cloud database
- **drizzle-orm**: Type-safe ORM with automatic migrations
- **drizzle-kit**: Database management and migration tools

### Frontend Libraries
- **@radix-ui/***: Comprehensive collection of unstyled, accessible UI primitives
- **@tanstack/react-query**: Powerful data synchronization for React
- **@hookform/resolvers**: React Hook Form integration with validation libraries
- **wouter**: Minimalist routing library for React

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit-specific development features
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

The application is configured for deployment with:
- **Development**: `npm run dev` - Uses tsx for TypeScript execution with Vite middleware
- **Production Build**: `npm run build` - Vite builds client assets, esbuild bundles server
- **Production**: `npm run start` - Runs the bundled server with static file serving
- **Database**: `npm run db:push` - Applies schema changes to database

The build process creates optimized client assets and a single bundled server file for efficient deployment.

## Changelog

- July 17, 2025. Converted to subscription-based payment system with Stripe
- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.

## Deployment Notes

### Cloudflare Deployment Issue
If subscription options don't appear on Cloudflare deployment:
1. Check that STRIPE_SECRET_KEY environment variable is set in production
2. Visit `/api/health` to verify Stripe configuration
3. Check browser console for API errors
4. See DEPLOYMENT_TROUBLESHOOTING.md for detailed steps