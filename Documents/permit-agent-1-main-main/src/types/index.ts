// Core Types for PermitAgent

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  latitude?: number;
  longitude?: number;
}

export interface Jurisdiction {
  id: string;
  name: string;
  type: 'city' | 'county' | 'state';
  address: Address;
  website: string;
  permitUrl?: string;
  contactInfo: ContactInfo;
  lastUpdated: Date;
  isActive: boolean;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: Address;
  hoursOfOperation?: BusinessHours;
}

export interface BusinessHours {
  monday?: TimeRange;
  tuesday?: TimeRange;
  wednesday?: TimeRange;
  thursday?: TimeRange;
  friday?: TimeRange;
  saturday?: TimeRange;
  sunday?: TimeRange;
}

export interface TimeRange {
  open: string; // HH:mm format
  close: string; // HH:mm format
}

export interface PermitType {
  id: string;
  name: string;
  category: PermitCategory;
  description?: string;
  jurisdictionId: string;
  requirements: string[];
  processingTime?: string;
  fees: PermitFee[];
  forms: PermitForm[];
  lastUpdated: Date;
}

export enum PermitCategory {
  BUILDING = 'building',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  MECHANICAL = 'mechanical',
  ZONING = 'zoning',
  DEMOLITION = 'demolition',
  SIGN = 'sign',
  OTHER = 'other'
}

export interface PermitFee {
  type: string;
  amount: number;
  unit?: string; // per square foot, flat fee, etc.
  description?: string;
  conditions?: string[];
}

export interface PermitForm {
  id: string;
  name: string;
  url: string;
  fileType: 'pdf' | 'doc' | 'online';
  isRequired: boolean;
  description?: string;
}

export interface UserProject {
  id: string;
  userId: string;
  name: string;
  address: Address;
  description?: string;
  permits: ProjectPermit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPermit {
  id: string;
  permitTypeId: string;
  status: PermitStatus;
  applicationDate?: Date;
  approvalDate?: Date;
  expirationDate?: Date;
  permitNumber?: string;
  notes?: string;
}

export enum PermitStatus {
  PLANNING = 'planning',
  APPLIED = 'applied',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface ScrapingResult {
  jurisdictionId: string;
  url: string;
  extractedData: ExtractedData;
  timestamp: Date;
  success: boolean;
  errors?: string[];
}

export interface ExtractedData {
  permits?: PermitType[];
  contact?: ContactInfo;
  forms?: PermitForm[];
  fees?: PermitFee[];
  requirements?: string[];
  processingInfo?: ProcessingInfo;
}

export interface ProcessingInfo {
  averageTime?: string;
  rushOptions?: string[];
  inspectionSchedule?: string;
  appealProcess?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface SearchRequest {
  address: Address;
  permitTypes?: PermitCategory[];
  includeNeighboringJurisdictions?: boolean;
}

export interface SearchResponse {
  jurisdiction: Jurisdiction;
  permits: PermitType[];
  forms: PermitForm[];
  contact: ContactInfo;
  processingInfo?: ProcessingInfo;
}

// UI Component Types
export interface FormProps {
  onSubmit: (data: unknown) => void;
  isLoading?: boolean;
  error?: string;
}

export interface DashboardData {
  recentSearches: SearchResponse[];
  savedProjects: UserProject[];
  favoriteJurisdictions: Jurisdiction[];
}

// Subscription and Usage Types
export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  planType: 'free' | 'pro' | 'business';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  usageCount: number;
  usageLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageLog {
  id: string;
  userId: string;
  searchAddress: string;
  timestamp: Date;
  planType: string;
  success: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface PlanConfig {
  name: string;
  type: 'free' | 'pro' | 'business';
  usageLimit: number;
  stripePriceId: string;
  features: string[];
  priceMonthly: number;
  priceAnnually?: number;
}

export interface UsageStats {
  subscription: {
    planType: string;
    status: string;
    usageCount: number;
    usageLimit: number;
    remaining: number;
    isUnlimited: boolean;
    currentPeriodEnd?: string;
  };
  usage: {
    totalSearches: number;
    successfulSearches: number;
    currentMonthUsage: number;
    canUse: boolean;
  };
  planInfo: {
    name: string;
    features: string[];
    upgradeAvailable: boolean;
  };
}

// Stripe-related types
export interface CheckoutSessionRequest {
  priceId: string;
  userId: string;
  planType: 'pro' | 'business';
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
}

export interface CustomerPortalRequest {
  userId: string;
  returnUrl?: string;
}

export interface CustomerPortalResponse {
  portalUrl: string;
}

// UI Component Props for Future Frontend Integration
export interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage?: number;
  limit?: number;
  planType?: string;
  trigger?: 'limit_reached' | 'upgrade_prompt' | 'feature_gate';
}

export interface PricingCardProps {
  plan: PlanConfig;
  isCurrentPlan?: boolean;
  isLoading?: boolean;
  onSelectPlan: (planType: 'pro' | 'business') => void;
}