-- Initialize DisModular.js Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (already handled by POSTGRES_DB env var)
-- But we can add any initial data or extensions here

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create any additional extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- The Prisma schema will handle table creation via migrations
-- This file is mainly for extensions and initial setup
