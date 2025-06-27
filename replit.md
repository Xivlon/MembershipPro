# Luggsters Membership Portal

## Overview

This is a full-stack web application for Luggsters, a travel luggage protection service. The application allows users to select and purchase membership plans with secure payment processing. Built as a monorepo with TypeScript throughout, it provides a seamless user experience for joining the Luggsters membership program.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React 18 with TypeScript, using Vite for build tooling and hot module replacement
- **Backend**: Express.js with TypeScript, serving both API endpoints and static files
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design system
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

## Key Components

### Frontend Architecture
- **React Components**: Modular component structure with reusable UI components
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessibility
- **Brand Identity**: Custom Luggsters logo component with animated elements
- **Form Validation**: Zod schemas for both client and server-side validation
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints

### Backend Architecture
- **API Layer**: RESTful endpoints for membership plans and payment processing
- **Storage Abstraction**: Interface-based storage layer supporting both in-memory and database implementations
- **Database Layer**: Drizzle ORM with PostgreSQL adapter for production
- **Development Mode**: Vite integration for seamless development experience
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Database Schema
The database consists of three main tables:
- **Users**: Basic user authentication with username/password
- **Membership Plans**: Plan details including pricing, features, and validity periods
- **Payments**: Payment records with cardholder information and transaction status

## Data Flow

1. **Plan Fetching**: Client requests available membership plans from `/api/membership-plans`
2. **Plan Selection**: User selects either monthly ($9.99) or annual ($99.99) plan
3. **Form Submission**: Payment form data is validated using Zod schemas
4. **Payment Processing**: Server processes payment and stores transaction record
5. **Success Handling**: Client displays success message and can redirect to dashboard

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL
- **@radix-ui/***: Collection of unstyled, accessible UI primitives
- **@tanstack/react-query**: Powerful data synchronization for React applications
- **react-hook-form**: Performant forms with easy validation
- **zod**: TypeScript-first schema validation library

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Static type checking throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Build Process**: Vite builds the client-side assets, esbuild bundles the server
- **Production Server**: Express.js serves both API endpoints and static files
- **Database**: PostgreSQL 16 module with Drizzle migrations
- **Port Configuration**: Server runs on port 5000, exposed as port 80
- **Environment**: Node.js 20 runtime with web and PostgreSQL modules

### Build Commands
- `npm run dev`: Development server with hot reloading
- `npm run build`: Production build for both client and server
- `npm run start`: Production server startup
- `npm run db:push`: Database schema migration

## Changelog

```
Changelog:
- June 27, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```