-- PermitAgent Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jurisdictions table
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('city', 'county', 'state')),
    website VARCHAR(500),
    permit_url VARCHAR(500),
    
    -- Address fields
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    county VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact information
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business Hours table
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false
);

-- Permit Types table
CREATE TABLE permit_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('building', 'electrical', 'plumbing', 'mechanical', 'zoning', 'demolition', 'sign', 'other')),
    description TEXT,
    processing_time VARCHAR(100),
    requirements TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permit Fees table
CREATE TABLE permit_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permit_type_id UUID REFERENCES permit_types(id) ON DELETE CASCADE,
    fee_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50), -- 'flat', 'per_sqft', 'per_unit', etc.
    description TEXT,
    conditions TEXT[]
);

-- Permit Forms table
CREATE TABLE permit_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permit_type_id UUID REFERENCES permit_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) CHECK (file_type IN ('pdf', 'doc', 'online')),
    is_required BOOLEAN DEFAULT true,
    description TEXT
);

-- Users table (for user authentication and management)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255), -- For email/password auth
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Projects table
CREATE TABLE user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Project address
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    county VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Permits table
CREATE TABLE project_permits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    permit_type_id UUID REFERENCES permit_types(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'applied', 'under_review', 'approved', 'rejected', 'expired')),
    application_date DATE,
    approval_date DATE,
    expiration_date DATE,
    permit_number VARCHAR(100),
    notes TEXT
);

-- Scraping Results table (for caching and monitoring)
CREATE TABLE scraping_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    success BOOLEAN NOT NULL,
    extracted_data JSONB,
    errors TEXT[],
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved Searches table (for user convenience)
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    search_query JSONB NOT NULL,
    results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_jurisdictions_location ON jurisdictions(city, state);
CREATE INDEX idx_jurisdictions_active ON jurisdictions(is_active);
CREATE INDEX idx_permit_types_category ON permit_types(category);
CREATE INDEX idx_permit_types_jurisdiction ON permit_types(jurisdiction_id);
CREATE INDEX idx_scraping_results_jurisdiction ON scraping_results(jurisdiction_id);
CREATE INDEX idx_scraping_results_timestamp ON scraping_results(scraped_at);
CREATE INDEX idx_user_projects_user ON user_projects(user_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jurisdictions_updated_at BEFORE UPDATE ON jurisdictions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permit_types_updated_at BEFORE UPDATE ON permit_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stripe Integration Tables

-- Subscriptions table to track user subscription status
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_subscription_id VARCHAR(255),
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'pro', 'business')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage logs to track API usage per user
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  search_address TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  plan_type VARCHAR(50) NOT NULL,
  success BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stripe events log to prevent duplicate webhook processing
CREATE TABLE IF NOT EXISTS stripe_events (
  id VARCHAR(255) PRIMARY KEY, -- Stripe event ID
  type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data JSONB NOT NULL
);

-- Additional indexes for Stripe integration
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(type);

-- Update triggers for subscription tables
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default subscription plans configuration
INSERT INTO subscriptions (user_id, stripe_customer_id, plan_type, status, usage_limit) 
VALUES 
  ('anonymous', 'anonymous', 'free', 'active', 3)
ON CONFLICT (user_id) DO NOTHING;