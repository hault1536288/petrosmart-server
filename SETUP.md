# Petrosmart Server Setup Guide

This guide will help you set up PostgreSQL database with Docker and data seeding for the Petrosmart server.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm/yarn installed
- Git installed

## Setup Instructions

### 1. Environment Configuration

Copy the environment example file and configure your settings:

```bash
cp env.example .env
```

The `.env` file contains the following configuration:

- Database connection settings
- Application port
- JWT configuration (for future use)

### 2. Start PostgreSQL Database

Start the PostgreSQL database using Docker Compose:

```bash
npm run db:up
```

This will start:

- PostgreSQL 15 database on port 5432
- pgAdmin web interface on port 8080 (optional)

### 3. Seed the Database

Run the database seeding script to populate initial data:

```bash
npm run db:seed
```

This will create 5 sample users in the database.

### 4. Start the Application

Start the NestJS application in development mode:

```bash
npm run start:dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

### Database Management

- `npm run db:up` - Start PostgreSQL database
- `npm run db:down` - Stop all Docker containers
- `npm run db:restart` - Restart PostgreSQL database
- `npm run db:logs` - View PostgreSQL logs
- `npm run db:seed` - Seed the database with initial data
- `npm run db:reset` - Reset database (remove data and reseed)
- `npm run pgadmin` - Start pgAdmin web interface

### Application

- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Start in production mode

## Database Access

### PostgreSQL Connection Details

- Host: localhost
- Port: 5432
- Database: petrosmart_db
- Username: petrosmart_user
- Password: petrosmart_password

### pgAdmin Access (Optional)

- URL: http://localhost:8080
- Email: admin@petrosmart.com
- Password: admin123

## API Endpoints

Once the application is running, you can access the following endpoints:

- `GET /users` - Get all users
- `POST /users` - Create a new user
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Troubleshooting

### Database Connection Issues

1. Ensure Docker is running
2. Check if PostgreSQL container is up: `docker ps`
3. View database logs: `npm run db:logs`

### Port Conflicts

If port 5432 is already in use, you can change it in the `docker-compose.yml` file and update the corresponding environment variables.

### Reset Everything

To completely reset the database and start fresh:

```bash
npm run db:reset
```

This will:

1. Stop and remove all containers and volumes
2. Start fresh PostgreSQL instance
3. Seed the database with initial data

## Development Notes

- The database schema is automatically synchronized in development mode
- Database logging is enabled in development mode
- The seeding script checks for existing data to avoid duplicates
- All database operations are logged in development mode
