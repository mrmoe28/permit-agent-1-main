// API Configuration
// Automatically detect environment and use appropriate endpoints

const isProduction = () => {
  // Check if we're in production environment (Vercel)
  return typeof window !== 'undefined' && 
         (window.location.hostname !== 'localhost' && 
          window.location.hostname !== '127.0.0.1' &&
          !window.location.hostname.includes('ngrok'));
};

const isDevelopment = () => {
  // Check if we're in development with local server
  return typeof window !== 'undefined' && 
         (window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1');
};

const isNgrok = () => {
  // Check if we're using ngrok tunnel
  return typeof window !== 'undefined' && 
         window.location.hostname.includes('ngrok');
};

export const API_CONFIG = {
  get BASE_URL() {
    if (isProduction()) {
      // Use relative paths for Vercel deployment
      return '';
    } else if (isDevelopment()) {
      // Use local server for development
      return 'http://localhost:3001';
    } else if (isNgrok()) {
      // Use current origin for ngrok
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
    // Fallback to relative paths
    return '';
  },
  
  get ENVIRONMENT() {
    if (isProduction()) return 'production';
    if (isDevelopment()) return 'development';
    if (isNgrok()) return 'ngrok';
    return 'unknown';
  }
};

export const getApiUrl = (endpoint: string) => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (isDevelopment()) {
    // Local development: use local server endpoints directly
    return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
  } else {
    // Production/Vercel: map frontend endpoints to API routes
    const apiEndpoint = mapToApiEndpoint(cleanEndpoint);
    return API_CONFIG.BASE_URL ? `${API_CONFIG.BASE_URL}${apiEndpoint}` : apiEndpoint;
  }
};

// Map frontend endpoints to Vercel API endpoints
function mapToApiEndpoint(endpoint: string): string {
  // If already has /api prefix, use as-is
  if (endpoint.startsWith('api/')) {
    return `/${endpoint}`;
  }
  
  // Map specific frontend endpoints to API endpoints
  const endpointMappings: Record<string, string> = {
    'sites': '/api/sites',
    'analyses': '/api/analyses',
    'health': '/api/health',
    'diagnostic': '/api/diagnostic',
    'simple': '/api/simple',
    'test': '/api/test'
  };
  
  // Check for exact matches
  if (endpointMappings[endpoint]) {
    return endpointMappings[endpoint];
  }
  
  // Check for pattern matches (e.g., analyses/:id)
  for (const [pattern, apiPath] of Object.entries(endpointMappings)) {
    if (endpoint.startsWith(pattern + '/')) {
      const pathSuffix = endpoint.substring(pattern.length);
      return apiPath + pathSuffix;
    }
  }
  
  // Default: assume it needs /api prefix
  return `/api/${endpoint}`;
}

// Debug helper
export const getApiDebugInfo = () => {
  return {
    environment: API_CONFIG.ENVIRONMENT,
    baseUrl: API_CONFIG.BASE_URL,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    isNgrok: isNgrok()
  };
};