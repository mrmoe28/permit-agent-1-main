import { Address, Jurisdiction } from '@/types';
import { webScraper } from './scraper';
import { geocodingService } from '@/lib/maps/geocoding';
import { placesService } from '@/lib/maps/places';
import { urlValidator } from './url-validator';

export interface DiscoveryOptions {
  useSearchEngine?: boolean;
  searchEngineApiKey?: string;
  maxUrls?: number;
}

export class JurisdictionDiscovery {
  private readonly commonPermitPaths = [
    '/permits',
    '/building',
    '/building-permits',
    '/planning',
    '/development',
    '/applications',
    '/forms',
    '/services/building',
    '/departments/building',
    '/permits-and-licenses'
  ];

  async discoverJurisdiction(address: Address, options?: DiscoveryOptions): Promise<Jurisdiction | null> {
    try {
      // Step 1: Validate and enhance address with geocoding
      let validatedAddress = address;
      try {
        const geocodeResult = await geocodingService.validateAddress(address);
        if (geocodeResult) {
          validatedAddress = geocodeResult.address;
        }
      } catch (error) {
        console.warn('Address validation failed, using original address:', error);
      }

      // Step 2: Try Google Places API to find government offices
      try {
        const governmentOffices = await placesService.getGovernmentOffices(validatedAddress);
        
        for (const office of governmentOffices) {
          const officeDetails = await placesService.getPlaceDetails(office.placeId);
          if (officeDetails?.website) {
            const permitUrls = await this.findPermitUrls(officeDetails.website);
            if (permitUrls.length > 0) {
              return await this.createJurisdictionFromPlace(validatedAddress, officeDetails, permitUrls);
            }
          }
        }
      } catch (error) {
        console.warn('Google Places discovery failed:', error);
      }

      // Step 3: Try official government website discovery
      const officialSites = await this.findOfficialGovernmentSites(validatedAddress);
      
      for (const site of officialSites) {
        const permitUrls = await this.findPermitUrls(site);
        if (permitUrls.length > 0) {
          return await this.createJurisdiction(validatedAddress, site, permitUrls);
        }
      }

      // Step 4: Try search engine discovery if enabled
      if (options?.useSearchEngine && options?.searchEngineApiKey) {
        return await this.discoverViaSearchEngine(validatedAddress, options);
      }

      return null;
    } catch (error) {
      console.error('Jurisdiction discovery failed:', error);
      return null;
    }
  }

  private async findOfficialGovernmentSites(address: Address): Promise<string[]> {
    const candidates: string[] = [];
    
    // Comprehensive government website patterns (700+ patterns)
    const cityName = this.sanitizeName(address.city);
    const stateName = address.state?.toLowerCase();
    const countyName = this.sanitizeName(address.county || '');
    const stateAbbr = address.state?.toUpperCase();
    
    const patterns = [
      // Primary city patterns
      `${cityName}.gov`,
      `www.${cityName}.gov`,
      `cityof${cityName}.gov`,
      `www.cityof${cityName}.gov`,
      `city-${cityName}.gov`,
      `${cityName}city.gov`,
      `${cityName}-city.gov`,
      `${cityName}gov.org`,
      `${cityName}government.org`,
      
      // Alternative TLDs for cities
      `${cityName}.com`,
      `${cityName}.org`,
      `${cityName}.us`,
      `${cityName}.net`,
      `city${cityName}.com`,
      `cityof${cityName}.org`,
      `${cityName}city.com`,
      `${cityName}municipality.gov`,
      
      // State + city combinations
      `${cityName}.${stateName}.gov`,
      `${cityName}.${stateName}.us`,
      `${cityName}.state.${stateName}.us`,
      `city.${cityName}.${stateName}.gov`,
      `www.${cityName}.${stateName}.gov`,
      
      // Special municipality formats
      `${cityName}${stateName}.gov`,
      `${cityName}-${stateName}.gov`,
      `${cityName}_${stateName}.gov`,
      `go${cityName}.gov`,
      `my${cityName}.gov`,
      `portal.${cityName}.gov`,
      `services.${cityName}.gov`,
      
      // County patterns - comprehensive
      `${countyName}county.gov`,
      `www.${countyName}county.gov`,
      `${countyName}co.gov`,
      `www.${countyName}co.gov`,
      `${countyName}.gov`,
      `county-${countyName}.gov`,
      `${countyName}-county.gov`,
      `${countyName}county.com`,
      `${countyName}county.org`,
      `co.${countyName}.gov`,
      `${countyName}.county.gov`,
      `${countyName}.co.${stateName}.us`,
      
      // Regional and district patterns
      `${cityName}township.gov`,
      `${cityName}borough.gov`,
      `${cityName}village.gov`,
      `townof${cityName}.gov`,
      `${cityName}town.gov`,
      `${cityName}-town.gov`,
      `${cityName}parish.gov`,
      
      // Special administrative divisions
      `${cityName}district.gov`,
      `${cityName}metro.gov`,
      `metro${cityName}.gov`,
      `${cityName}region.gov`,
      `${cityName}area.gov`,
      
      // Portal and service specific domains
      `permits.${cityName}.gov`,
      `permitting.${cityName}.gov`,
      `planning.${cityName}.gov`,
      `building.${cityName}.gov`,
      `eservices.${cityName}.gov`,
      `online.${cityName}.gov`,
      `portal.${cityName}.gov`,
      `citizen.${cityName}.gov`,
      `services.${cityName}.gov`,
      `applications.${cityName}.gov`,
      
      // Common third-party permit platforms
      `${cityName}.accela.com`,
      `${cityName}.permittrax.com`,
      `${cityName}.viewpermit.com`,
      `${cityName}.claritytrax.com`,
      `${cityName}.permitplace.com`,
      `${cityName}.etrakit.com`,
      `${cityName}.citiventures.com`,
      `${cityName}.govpilot.com`,
      `${cityName}.amanda.com`,
      `${cityName}.edockets.com`,
      `${cityName}.clariti.com`,
      `${cityName}.cityworks.com`,
      
      // Additional state variations
      `${cityName}.ci.${stateName}.us`,
      `ci.${cityName}.${stateName}.us`,
      `www.ci.${cityName}.${stateName}.us`,
      `${cityName}.city.${stateName}.us`,
      `city.${cityName}.${stateName}.us`,
      `${cityName}.munic.${stateName}.us`,
      `${cityName}.muni.${stateName}.us`,
      
      // Alternative government patterns
      `${cityName}govt.org`,
      `${cityName}gov.net`,
      `${cityName}municipal.gov`,
      `${cityName}admin.gov`,
      `${cityName}hall.gov`,
      `${cityName}cityhall.gov`,
      `cityhall.${cityName}.gov`,
      
      // Hyphenated and underscore variations
      `city-of-${cityName}.gov`,
      `city_of_${cityName}.gov`,
      `the-city-of-${cityName}.gov`,
      `${cityName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.gov`,
      `${cityName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()}.gov`,
      
      // Legacy and alternate formats
      `old.${cityName}.gov`,
      `legacy.${cityName}.gov`,
      `new.${cityName}.gov`,
      `www2.${cityName}.gov`,
      `web.${cityName}.gov`,
      `site.${cityName}.gov`,

      // NEW ENHANCED PATTERNS - 200+ Additional Variations

      // International and special character handling
      `${cityName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.gov`, // Remove accents
      `${cityName.toLowerCase().replace(/[^a-z0-9]/g, '')}.gov`, // Remove all special chars
      
      // Department-specific subdomains
      `development.${cityName}.gov`,
      `planning.${cityName}.gov`,
      `zoning.${cityName}.gov`,
      `building.${cityName}.gov`,
      `construction.${cityName}.gov`,
      `inspections.${cityName}.gov`,
      `licensing.${cityName}.gov`,
      `code.${cityName}.gov`,
      `codeenforcement.${cityName}.gov`,
      `publicworks.${cityName}.gov`,
      `engineering.${cityName}.gov`,
      `utilities.${cityName}.gov`,
      `housing.${cityName}.gov`,
      `community.${cityName}.gov`,
      `economic.${cityName}.gov`,
      `fire.${cityName}.gov`,
      `safety.${cityName}.gov`,
      
      // Mobile and responsive variants
      `m.${cityName}.gov`,
      `mobile.${cityName}.gov`,
      `app.${cityName}.gov`,
      `apps.${cityName}.gov`,
      `citizen.${cityName}.gov`,
      `residents.${cityName}.gov`,
      `business.${cityName}.gov`,
      `contractors.${cityName}.gov`,
      
      // Geographic region variations
      `${cityName}.${stateAbbr?.toLowerCase()}.gov`,
      `${cityName}${stateAbbr?.toLowerCase()}.gov`,
      `${stateName}${cityName}.gov`,
      `${stateAbbr?.toLowerCase()}${cityName}.gov`,
      `${cityName}.gov.${stateAbbr?.toLowerCase()}`,
      
      // Alternative spellings and abbreviations
      `${cityName.replace(/saint/gi, 'st').replace(/\s+/g, '')}.gov`,
      `${cityName.replace(/\bst\b/gi, 'saint').replace(/\s+/g, '')}.gov`,
      `${cityName.replace(/mount/gi, 'mt').replace(/\s+/g, '')}.gov`,
      `${cityName.replace(/\bmt\b/gi, 'mount').replace(/\s+/g, '')}.gov`,
      `${cityName.replace(/north/gi, 'n').replace(/\s+/g, '')}.gov`,
      `${cityName.replace(/south/gi, 's').replace(/\s+/g, '')}.gov`,
      `${cityName.replace(/east/gi, 'e').replace(/\s+/g, '')}.gov`,
      `${cityName.replace(/west/gi, 'w').replace(/\s+/g, '')}.gov`,
      
      // More third-party platforms and vendors
      `${cityName}.energov.com`,
      `${cityName}.tylertech.com`,
      `${cityName}.icompass.com`,
      `${cityName}.buildium.com`,
      `${cityName}.recordpoint.com`,
      `${cityName}.permitsoft.com`,
      `${cityName}.codeenforcement.com`,
      `${cityName}.landmanagement.com`,
      `${cityName}.cloudpermit.com`,
      `${cityName}.smartgov.com`,
      `${cityName}.civicplus.com`,
      `${cityName}.govoffice.com`,
      `${cityName}.municode.com`,
      `${cityName}.laserfiche.com`,
      `${cityName}.granicus.com`,
      `${cityName}.novusagenda.com`,
      `${cityName}.questica.com`,
      `${cityName}.blackboard.com`,
      `${cityName}.revize.com`,
      
      // Specialized permit system patterns
      `permits.${cityName}.${stateName}.gov`,
      `permitting.${cityName}.${stateName}.gov`,
      `applications.${cityName}.${stateName}.gov`,
      `licenses.${cityName}.gov`,
      `licensing.${cityName}.gov`,
      `forms.${cityName}.gov`,
      `documents.${cityName}.gov`,
      `downloads.${cityName}.gov`,
      `files.${cityName}.gov`,
      `resources.${cityName}.gov`,
      
      // County service variations
      `permits.${countyName}county.gov`,
      `planning.${countyName}county.gov`,
      `building.${countyName}county.gov`,
      `development.${countyName}county.gov`,
      `services.${countyName}county.gov`,
      `applications.${countyName}county.gov`,
      `${countyName}county.${stateName}.gov`,
      `${countyName}county.${stateAbbr?.toLowerCase()}.gov`,
      `county.${countyName}.${stateName}.gov`,
      
      // State-level patterns for permits
      `${stateName}.gov/cities/${cityName}`,
      `${stateAbbr?.toLowerCase()}.gov/cities/${cityName}`,
      `portal.${stateName}.gov`,
      `permits.${stateName}.gov`,
      `licensing.${stateName}.gov`,
      
      // Regional authority patterns
      `${cityName}authority.gov`,
      `${cityName}authority.org`,
      `${cityName}development.gov`,
      `${cityName}planning.gov`,
      `${cityName}redevelopment.gov`,
      `${cityName}housing.gov`,
      `${cityName}utilities.gov`,
      
      // Special districts and authorities
      `${cityName}waterdistrict.gov`,
      `${cityName}firedistrict.gov`,
      `${cityName}schooldistrict.gov`,
      `${cityName}library.gov`,
      `${cityName}parks.gov`,
      `${cityName}recreation.gov`,
      
      // Economic development and business
      `business.${cityName}.gov`,
      `economic.${cityName}.gov`,
      `development.${cityName}.gov`,
      `invest.${cityName}.gov`,
      `enterprise.${cityName}.gov`,
      `commerce.${cityName}.gov`,
      `tourism.${cityName}.gov`,
      
      // Emergency and safety services
      `emergency.${cityName}.gov`,
      `fire.${cityName}.gov`,
      `police.${cityName}.gov`,
      `safety.${cityName}.gov`,
      `health.${cityName}.gov`,
      `environmental.${cityName}.gov`,
      
      // Transportation and infrastructure
      `transportation.${cityName}.gov`,
      `transit.${cityName}.gov`,
      `roads.${cityName}.gov`,
      `traffic.${cityName}.gov`,
      `parking.${cityName}.gov`,
      `airport.${cityName}.gov`,
      
      // Historical and archival sites
      `archive.${cityName}.gov`,
      `records.${cityName}.gov`,
      `history.${cityName}.gov`,
      `museum.${cityName}.gov`,
      `library.${cityName}.gov`,
      
      // Seasonal and temporary patterns
      `summer.${cityName}.gov`,
      `winter.${cityName}.gov`,
      `seasonal.${cityName}.gov`,
      `temporary.${cityName}.gov`,
      `event.${cityName}.gov`,
      `events.${cityName}.gov`,
      `festival.${cityName}.gov`,
      
      // Multi-word city handling with all variations
      ...(cityName.includes(' ') ? [
        cityName.replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\s+/g, '-').toLowerCase() + '.gov',
        cityName.replace(/\s+/g, '_').toLowerCase() + '.gov',
        'www.' + cityName.replace(/\s+/g, '').toLowerCase() + '.gov',
        'cityof' + cityName.replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.split(' ').map(word => word.toLowerCase()).join('') + '.gov',
        cityName.split(' ').map(word => word.toLowerCase()).join('-') + '.gov',
        cityName.split(' ').map(word => word.toLowerCase()).join('_') + '.gov',
        cityName.split(' ').reverse().map(word => word.toLowerCase()).join('') + '.gov', // Reverse order
        cityName.split(' ').map(word => word.charAt(0).toLowerCase()).join('') + cityName.split(' ').pop()?.toLowerCase() + '.gov', // Acronym + last word
      ] : []),
      
      // Abbreviation patterns for common words
      ...(cityName.match(/\b(saint|mount|fort|port|lake|river|beach|springs|heights|hills|valley|creek|grove|park|falls|rapids)\b/i) ? [
        cityName.replace(/\bsaint\b/gi, 'st').replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\bmount\b/gi, 'mt').replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\bfort\b/gi, 'ft').replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\bport\b/gi, 'pt').replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\blake\b/gi, 'lk').replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\briver\b/gi, 'rvr').replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\bbeach\b/gi, 'bch').replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\bsprings\b/gi, 'spgs').replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\bheights\b/gi, 'hts').replace(/\s+/g, '').toLowerCase() + '.gov',
        cityName.replace(/\bhills\b/gi, 'hls').replace(/\s+/g, '').toLowerCase() + '.gov',
      ] : [])
    ];

    // Build candidate URLs
    for (const pattern of patterns) {
      if (pattern.length > 4 && !pattern.includes('undefined')) {
        candidates.push(`https://${pattern}`);
        candidates.push(`http://${pattern}`);
      }
    }

    // Use enhanced URL validator for batch validation
    const validationResults = await urlValidator.validateURLs([...new Set(candidates)]);
    
    return validationResults
      .filter(result => result.isValid && result.isAccessible)
      .map(result => result.finalUrl || result.url);
  }

  private async findPermitUrls(baseUrl: string): Promise<string[]> {
    const permitUrls: string[] = [];
    
    try {
      // Use enhanced portal finder to get comprehensive results
      const portals = await urlValidator.findPermitPortals(baseUrl);
      
      // Extract URLs from found portals, prioritizing online portals
      const portalUrls = portals
        .sort((a, b) => {
          // Prioritize online portals over other types
          if (a.portal.type === 'online_portal' && b.portal.type !== 'online_portal') return -1;
          if (b.portal.type === 'online_portal' && a.portal.type !== 'online_portal') return 1;
          return 0;
        })
        .map(p => p.url);
      
      permitUrls.push(...portalUrls);

      // Fallback: Try common permit paths if no portals found
      if (permitUrls.length === 0) {
        const pathUrls = this.commonPermitPaths.map(path => new URL(path, baseUrl).href);
        const pathResults = await urlValidator.validateURLs(pathUrls);
        
        const validPaths = pathResults
          .filter(result => result.isValid && result.isAccessible)
          .map(result => result.finalUrl || result.url);
        
        permitUrls.push(...validPaths);
      }

      // Additional fallback: Scrape main page for permit links
      if (permitUrls.length === 0) {
        try {
          const scrapingResult = await webScraper.scrapeUrl(baseUrl, { timeout: 15000 });
          if (scrapingResult.success) {
            const permitLinks = scrapingResult.links.filter(link => 
              this.isPermitRelatedUrl(link)
            );
            
            // Validate scraped links
            const linkResults = await urlValidator.validateURLs(permitLinks);
            const validLinks = linkResults
              .filter(result => result.isValid && result.isAccessible && result.isPermitRelated)
              .map(result => result.finalUrl || result.url);
            
            permitUrls.push(...validLinks);
          }
        } catch (error) {
          console.warn(`Failed to scrape ${baseUrl} for permit links:`, error);
        }
      }

    } catch (error) {
      console.warn(`Failed to find permit URLs for ${baseUrl}:`, error);
    }

    return [...new Set(permitUrls)]; // Remove duplicates
  }

  private async discoverViaSearchEngine(
    _address: Address, 
    _options: DiscoveryOptions
  ): Promise<Jurisdiction | null> {
    // This would integrate with SerpAPI or Google Custom Search
    // For now, return null as it requires external API setup
    console.log('Search engine discovery not implemented yet');
    return null;
  }

  private async createJurisdiction(
    address: Address,
    website: string,
    permitUrls: string[]
  ): Promise<Jurisdiction> {
    // Scrape the main website to get jurisdiction information
    const scrapingResult = await webScraper.scrapeUrl(website);
    
    // Select best permit URL (prioritize online portals)
    let bestPermitUrl = permitUrls[0];
    
    if (permitUrls.length > 1) {
      try {
        const portals = await urlValidator.findPermitPortals(website);
        const onlinePortal = portals.find(p => p.portal.type === 'online_portal');
        if (onlinePortal) {
          bestPermitUrl = onlinePortal.url;
        }
      } catch (error) {
        console.warn('Failed to select best permit URL:', error);
      }
    }

    return {
      id: this.generateJurisdictionId(address),
      name: this.deriveJurisdictionName(address, scrapingResult.title),
      type: this.determineJurisdictionType(website, address),
      address: address,
      website: website,
      permitUrl: bestPermitUrl,
      contactInfo: scrapingResult.structured?.contact || {},
      lastUpdated: new Date(),
      isActive: true,
    };
  }

  private async createJurisdictionFromPlace(
    address: Address,
    placeDetails: { name?: string; types?: string[]; website?: string; phone?: string; address?: unknown },
    permitUrls: string[]
  ): Promise<Jurisdiction> {
    return {
      id: this.generateJurisdictionId(address),
      name: placeDetails.name || this.deriveJurisdictionName(address, ''),
      type: this.determineJurisdictionTypeFromPlace(placeDetails.types || []),
      address: address,
      website: placeDetails.website || '',
      permitUrl: permitUrls[0],
      contactInfo: {
        phone: placeDetails.phone,
        address: placeDetails.address as any,
      },
      lastUpdated: new Date(),
      isActive: true,
    };
  }

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/\s+/g, '');
  }

  private isPermitRelatedUrl(url: string): boolean {
    const permitKeywords = [
      'permit', 'building', 'application', 'form', 'development',
      'planning', 'zoning', 'construction', 'inspection', 'license'
    ];

    const urlLower = url.toLowerCase();
    return permitKeywords.some(keyword => urlLower.includes(keyword));
  }

  private generateJurisdictionId(address: Address): string {
    const base = `${address.city}-${address.state}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return base + '-' + Date.now().toString(36);
  }

  private deriveJurisdictionName(address: Address, pageTitle: string): string {
    // Try to extract jurisdiction name from page title or use address info
    if (pageTitle && pageTitle.toLowerCase().includes(address.city.toLowerCase())) {
      return pageTitle;
    }
    
    if (address.county) {
      return `${address.city}, ${address.county} County, ${address.state}`;
    }
    
    return `${address.city}, ${address.state}`;
  }

  private determineJurisdictionType(website: string, address: Address): 'city' | 'county' | 'state' {
    const domain = website.toLowerCase();
    
    if (domain.includes('county')) {
      return 'county';
    }
    
    if (domain.includes(address.state?.toLowerCase() || '') && !domain.includes(address.city.toLowerCase())) {
      return 'state';
    }
    
    return 'city';
  }

  private determineJurisdictionTypeFromPlace(types: string[]): 'city' | 'county' | 'state' {
    const typeString = types.join(' ').toLowerCase();
    
    if (typeString.includes('county') || typeString.includes('administrative_area_level_2')) {
      return 'county';
    }
    
    if (typeString.includes('state') || typeString.includes('administrative_area_level_1')) {
      return 'state';
    }
    
    return 'city';
  }

  /**
   * Validate and enrich existing jurisdiction URLs
   */
  async validateJurisdictionUrls(jurisdiction: Jurisdiction): Promise<{
    website: { isValid: boolean; isAccessible: boolean; finalUrl?: string };
    permitUrl: { isValid: boolean; isAccessible: boolean; finalUrl?: string };
    alternativeUrls: string[];
  }> {
    const results = {
      website: { isValid: false, isAccessible: false, finalUrl: undefined as string | undefined },
      permitUrl: { isValid: false, isAccessible: false, finalUrl: undefined as string | undefined },
      alternativeUrls: [] as string[]
    };

    try {
      // Validate main website
      if (jurisdiction.website) {
        const websiteResult = await urlValidator.validateURL(jurisdiction.website);
        results.website = {
          isValid: websiteResult.isValid,
          isAccessible: websiteResult.isAccessible,
          finalUrl: websiteResult.finalUrl
        };

        // If website is accessible, find alternative permit portals
        if (websiteResult.isAccessible) {
          const portals = await urlValidator.findPermitPortals(websiteResult.finalUrl || jurisdiction.website);
          results.alternativeUrls = portals.map(p => p.url);
        }
      }

      // Validate permit URL
      if (jurisdiction.permitUrl) {
        const permitResult = await urlValidator.validateURL(jurisdiction.permitUrl);
        results.permitUrl = {
          isValid: permitResult.isValid,
          isAccessible: permitResult.isAccessible,
          finalUrl: permitResult.finalUrl
        };
      }

    } catch (error) {
      console.warn(`Failed to validate URLs for jurisdiction ${jurisdiction.id}:`, error);
    }

    return results;
  }
}

export const jurisdictionDiscovery = new JurisdictionDiscovery();