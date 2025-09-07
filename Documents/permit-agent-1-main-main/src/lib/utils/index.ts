import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): string {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode
  ].filter(Boolean);
  
  return parts.join(', ');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function parseBusinessHours(hoursText: string) {
  // Common patterns for business hours parsing
  const patterns = [
    /(\w+)\s*:\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/gi,
    /(\w+)\s*:\s*(\d{1,2})\s*(AM|PM)\s*-\s*(\d{1,2})\s*(AM|PM)/gi,
    /(\w+)\s*:\s*Closed/gi
  ];
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const result: Record<string, { open: string; close: string } | null> = {};
  
  for (const pattern of patterns) {
    const matches = [...hoursText.matchAll(pattern)];
    for (const match of matches) {
      const dayName = match[1].toLowerCase();
      if (days.includes(dayName)) {
        if (match[0].toLowerCase().includes('closed')) {
          result[dayName] = null;
        } else {
          // Parse time ranges - implementation would depend on specific format
          result[dayName] = {
            open: convertTo24Hour(match[2], match[4]),
            close: convertTo24Hour(match[5], match[7])
          };
        }
      }
    }
  }
  
  return result;
}

function convertTo24Hour(hour: string, period: string): string {
  let h = parseInt(hour);
  if (period.toUpperCase() === 'PM' && h !== 12) {
    h += 12;
  } else if (period.toUpperCase() === 'AM' && h === 12) {
    h = 0;
  }
  return h.toString().padStart(2, '0') + ':00';
}

export function extractPhoneNumbers(text: string): string[] {
  const phonePattern = /(\+?1[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g;
  const matches = text.match(phonePattern);
  return matches ? matches.map(phone => phone.trim()) : [];
}

export function extractEmails(text: string): string[] {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailPattern);
  return matches ? matches.map(email => email.toLowerCase()) : [];
}

export function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch {
    // Try to fix common URL issues
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    try {
      return new URL(url).href;
    } catch {
      return url;
    }
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}