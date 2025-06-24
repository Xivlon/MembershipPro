# Luggsters Membership Portal

## Overview

This is a full-stack web application for Luggsters, a travel luggage protection service. The application allows users to select and purchase membership plans with secure payment processing. Built as a modern React SPA with Express.js backend, it features a clean, professional UI for membership enrollment.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React 18 with TypeScript, using Vite for build tooling
- **Backend**: Express.js with TypeScript, serving both API endpoints and static files
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **React Router**: Uses Wouter for lightweight client-side routing
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: TanStack Query for API state management
- **Styling**: Tailwind CSS with custom Luggsters brand colors

### Backend Architecture
- **API Routes**: RESTful endpoints for membership plans and payment processing
- **Database Layer**: Drizzle ORM with PostgreSQL adapter
- **Storage Interface**: Abstracted storage layer supporting both in-memory and database implementations
- **Development Server**: Vite integration for hot module replacement

### Database Schema
- **Users**: Basic user authentication (username/password)
- **Membership Plans**: Plan details including pricing, features, and validity periods
- **Payments**: Payment records with cardholder information and status tracking

## Data Flow

1. **Plan Selection**: Client fetches available membership plans from `/api/membership-plans`
2. **Payment Processing**: User submits payment form to `/api/payments` with validation
3. **Form Validation**: Zod schemas ensure data integrity on both client and server
4. **Storage**: Payment records stored with status tracking for completion/failure states

## External Dependencies

### Production Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon
- **drizzle-orm**: Type-safe ORM for database operations
- **@radix-ui/***: Unstyled, accessible UI primitives
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling with validation
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the application
- **ESBuild**: Fast JavaScript bundler for production builds
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` - Starts development server with hot reloading
- **Build**: `npm run build` - Creates optimized production build
- **Production**: `npm run start` - Serves production build
- **Database**: PostgreSQL integration with environment-based configuration

### Environment Configuration
- Uses `DATABASE_URL` environment variable for PostgreSQL connection
- Supports both development (in-memory storage) and production (database) modes
- Auto-scaling deployment target configured for Replit

## Changelog

- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.