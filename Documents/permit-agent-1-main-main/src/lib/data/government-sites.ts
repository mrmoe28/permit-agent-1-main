export interface GovernmentSite {
  city: string;
  state: string;
  website: string;
  permitUrl: string;
  formsUrl?: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  permitTypes: string[];
  notes?: string;
}

export const governmentSites: GovernmentSite[] = [
  // Major Cities - California
  {
    city: 'San Francisco',
    state: 'CA',
    website: 'https://sf.gov',
    permitUrl: 'https://sf.gov/topics/building-permits',
    formsUrl: 'https://sf.gov/forms',
    contactInfo: {
      phone: '(415) 558-6000',
      email: 'dbw@sfgov.org',
      address: '49 South Van Ness Avenue, San Francisco, CA 94103'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Uses SFGov portal for online applications'
  },
  {
    city: 'Los Angeles',
    state: 'CA',
    website: 'https://www.ladbss.lacity.org',
    permitUrl: 'https://www.ladbss.lacity.org/permits',
    formsUrl: 'https://www.ladbss.lacity.org/forms',
    contactInfo: {
      phone: '(213) 482-7000',
      email: 'ladbs@lacity.org',
      address: '201 N Figueroa St, Los Angeles, CA 90012'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'LADBS handles all building and safety permits'
  },
  {
    city: 'San Diego',
    state: 'CA',
    website: 'https://www.sandiego.gov',
    permitUrl: 'https://www.sandiego.gov/development-services',
    formsUrl: 'https://www.sandiego.gov/development-services/permits/forms',
    contactInfo: {
      phone: '(619) 446-5000',
      email: 'dsd@sandiego.gov',
      address: '1222 First Avenue, San Diego, CA 92101'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Development Services Department handles permits'
  },

  // Major Cities - New York
  {
    city: 'New York',
    state: 'NY',
    website: 'https://www1.nyc.gov',
    permitUrl: 'https://www1.nyc.gov/site/buildings/business/permits.page',
    formsUrl: 'https://www1.nyc.gov/site/buildings/business/forms.page',
    contactInfo: {
      phone: '(212) 639-9675',
      email: 'customerservice@buildings.nyc.gov',
      address: '280 Broadway, New York, NY 10007'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'NYC Department of Buildings handles all permits'
  },

  // Major Cities - Texas
  {
    city: 'Houston',
    state: 'TX',
    website: 'https://www.houston.gov',
    permitUrl: 'https://www.houston.gov/permits',
    formsUrl: 'https://www.houston.gov/permits/forms',
    contactInfo: {
      phone: '(832) 394-9000',
      email: 'permits@houstontx.gov',
      address: '1002 Washington Avenue, Houston, TX 77002'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Houston Permitting Center handles all permits'
  },
  {
    city: 'Austin',
    state: 'TX',
    website: 'https://www.austintexas.gov',
    permitUrl: 'https://www.austintexas.gov/department/development-services',
    formsUrl: 'https://www.austintexas.gov/department/development-services/permits/forms',
    contactInfo: {
      phone: '(512) 974-2000',
      email: 'dsd@austintexas.gov',
      address: '505 Barton Springs Road, Austin, TX 78704'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Development Services Department handles permits'
  },

  // Major Cities - Florida
  {
    city: 'Miami',
    state: 'FL',
    website: 'https://www.miamigov.com',
    permitUrl: 'https://www.miamigov.com/Government/Departments-Organizations/Planning-Building/Planning-Building-Permits',
    formsUrl: 'https://www.miamigov.com/Government/Departments-Organizations/Planning-Building/Planning-Building-Permits/Forms',
    contactInfo: {
      phone: '(305) 250-5400',
      email: 'building@miamigov.com',
      address: '444 SW 2nd Avenue, Miami, FL 33130'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Planning and Building Department handles permits'
  },

  // Major Cities - Illinois
  {
    city: 'Chicago',
    state: 'IL',
    website: 'https://www.chicago.gov',
    permitUrl: 'https://www.chicago.gov/city/en/depts/bldgs/provdrs/permits.html',
    formsUrl: 'https://www.chicago.gov/city/en/depts/bldgs/provdrs/permits/forms.html',
    contactInfo: {
      phone: '(312) 744-5000',
      email: 'permitcenter@cityofchicago.org',
      address: '121 N LaSalle St, Chicago, IL 60602'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Department of Buildings handles all permits'
  },

  // Major Cities - Georgia
  {
    city: 'Atlanta',
    state: 'GA',
    website: 'https://www.atlantaga.gov',
    permitUrl: 'https://www.atlantaga.gov/government/departments/office-of-buildings/permits',
    formsUrl: 'https://www.atlantaga.gov/government/departments/office-of-buildings/permits/forms',
    contactInfo: {
      phone: '(404) 330-6000',
      email: 'permits@atlantaga.gov',
      address: '55 Trinity Avenue SW, Atlanta, GA 30303'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Office of Buildings handles all permits'
  },

  // Major Cities - Washington
  {
    city: 'Seattle',
    state: 'WA',
    website: 'https://www.seattle.gov',
    permitUrl: 'https://www.seattle.gov/sdci/permits',
    formsUrl: 'https://www.seattle.gov/sdci/permits/forms',
    contactInfo: {
      phone: '(206) 684-8600',
      email: 'sdci@seattle.gov',
      address: '700 5th Avenue, Seattle, WA 98104'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Seattle Department of Construction and Inspections'
  },

  // Major Cities - Colorado
  {
    city: 'Denver',
    state: 'CO',
    website: 'https://www.denvergov.org',
    permitUrl: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-Development/Development-Services/Development-Services-Permits',
    formsUrl: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-Development/Development-Services/Development-Services-Permits/Forms',
    contactInfo: {
      phone: '(720) 865-3000',
      email: 'development.services@denvergov.org',
      address: '201 W Colfax Ave, Denver, CO 80202'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Community Planning and Development Department'
  },

  // Major Cities - Arizona
  {
    city: 'Phoenix',
    state: 'AZ',
    website: 'https://www.phoenix.gov',
    permitUrl: 'https://www.phoenix.gov/planning/permits',
    formsUrl: 'https://www.phoenix.gov/planning/permits/forms',
    contactInfo: {
      phone: '(602) 262-6000',
      email: 'planning@phoenix.gov',
      address: '200 W Washington St, Phoenix, AZ 85003'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Planning and Development Department'
  },

  // Major Cities - Pennsylvania
  {
    city: 'Philadelphia',
    state: 'PA',
    website: 'https://www.phila.gov',
    permitUrl: 'https://www.phila.gov/departments/department-of-licenses-and-inspections/permits/',
    formsUrl: 'https://www.phila.gov/departments/department-of-licenses-and-inspections/permits/forms/',
    contactInfo: {
      phone: '(215) 686-1776',
      email: 'l&i@phila.gov',
      address: '1401 John F Kennedy Blvd, Philadelphia, PA 19102'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Department of Licenses and Inspections'
  },

  // Major Cities - Michigan
  {
    city: 'Detroit',
    state: 'MI',
    website: 'https://detroitmi.gov',
    permitUrl: 'https://detroitmi.gov/departments/buildings-safety-engineering-and-environmental-department',
    formsUrl: 'https://detroitmi.gov/departments/buildings-safety-engineering-and-environmental-department/permits',
    contactInfo: {
      phone: '(313) 224-2737',
      email: 'bsee@detroitmi.gov',
      address: '2 Woodward Avenue, Detroit, MI 48226'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Buildings, Safety Engineering and Environmental Department'
  },

  // Major Cities - Ohio
  {
    city: 'Cleveland',
    state: 'OH',
    website: 'https://www.clevelandohio.gov',
    permitUrl: 'https://www.clevelandohio.gov/government/departments/building-housing/permits',
    formsUrl: 'https://www.clevelandohio.gov/government/departments/building-housing/permits/forms',
    contactInfo: {
      phone: '(216) 664-2000',
      email: 'building@clevelandohio.gov',
      address: '601 Lakeside Avenue, Cleveland, OH 44114'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Department of Building and Housing'
  },

  // Major Cities - Tennessee
  {
    city: 'Nashville',
    state: 'TN',
    website: 'https://www.nashville.gov',
    permitUrl: 'https://www.nashville.gov/departments/codes-administration/permits',
    formsUrl: 'https://www.nashville.gov/departments/codes-administration/permits/forms',
    contactInfo: {
      phone: '(615) 862-6500',
      email: 'codes@nashville.gov',
      address: '800 2nd Avenue South, Nashville, TN 37210'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Department of Codes Administration'
  },

  // Major Cities - Oregon
  {
    city: 'Portland',
    state: 'OR',
    website: 'https://www.portland.gov',
    permitUrl: 'https://www.portland.gov/bds/permits',
    formsUrl: 'https://www.portland.gov/bds/permits/forms',
    contactInfo: {
      phone: '(503) 823-7300',
      email: 'bds@portlandoregon.gov',
      address: '1900 SW 4th Avenue, Portland, OR 97201'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Bureau of Development Services'
  },

  // Major Cities - Nevada
  {
    city: 'Las Vegas',
    state: 'NV',
    website: 'https://www.lasvegasnevada.gov',
    permitUrl: 'https://www.lasvegasnevada.gov/government/departments/planning/permits',
    formsUrl: 'https://www.lasvegasnevada.gov/government/departments/planning/permits/forms',
    contactInfo: {
      phone: '(702) 229-6011',
      email: 'planning@lasvegasnevada.gov',
      address: '495 S Main St, Las Vegas, NV 89101'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Department of Planning'
  },

  // Major Cities - Utah
  {
    city: 'Salt Lake City',
    state: 'UT',
    website: 'https://www.slc.gov',
    permitUrl: 'https://www.slc.gov/planning/permits/',
    formsUrl: 'https://www.slc.gov/planning/permits/forms/',
    contactInfo: {
      phone: '(801) 535-6000',
      email: 'planning@slc.gov',
      address: '451 S State St, Salt Lake City, UT 84111'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Planning Division'
  },

  // Major Cities - Minnesota
  {
    city: 'Minneapolis',
    state: 'MN',
    website: 'https://www.minneapolismn.gov',
    permitUrl: 'https://www.minneapolismn.gov/government/programs-initiatives/construction-permits/',
    formsUrl: 'https://www.minneapolismn.gov/government/programs-initiatives/construction-permits/forms/',
    contactInfo: {
      phone: '(612) 673-3000',
      email: 'permits@minneapolismn.gov',
      address: '350 S 5th St, Minneapolis, MN 55415'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Construction Permits Program'
  },

  // Major Cities - Wisconsin
  {
    city: 'Milwaukee',
    state: 'WI',
    website: 'https://city.milwaukee.gov',
    permitUrl: 'https://city.milwaukee.gov/dns/permits',
    formsUrl: 'https://city.milwaukee.gov/dns/permits/forms',
    contactInfo: {
      phone: '(414) 286-2000',
      email: 'dns@milwaukee.gov',
      address: '200 E Wells St, Milwaukee, WI 53202'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Department of Neighborhood Services'
  },

  // Major Cities - Missouri
  {
    city: 'Kansas City',
    state: 'MO',
    website: 'https://www.kcmo.gov',
    permitUrl: 'https://www.kcmo.gov/government/departments/planning-development/permits',
    formsUrl: 'https://www.kcmo.gov/government/departments/planning-development/permits/forms',
    contactInfo: {
      phone: '(816) 513-1000',
      email: 'planning@kcmo.org',
      address: '414 E 12th St, Kansas City, MO 64106'
    },
    permitTypes: ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'],
    notes: 'Planning and Development Department'
  }
];

export function findGovernmentSite(city: string, state: string): GovernmentSite | null {
  const normalizedCity = city.toLowerCase().trim();
  const normalizedState = state.toLowerCase().trim();
  
  return governmentSites.find(site => 
    site.city.toLowerCase() === normalizedCity && 
    site.state.toLowerCase() === normalizedState
  ) || null;
}

export function getAllGovernmentSites(): GovernmentSite[] {
  return governmentSites;
}

export function searchGovernmentSites(query: string): GovernmentSite[] {
  const normalizedQuery = query.toLowerCase();
  
  return governmentSites.filter(site => 
    site.city.toLowerCase().includes(normalizedQuery) ||
    site.state.toLowerCase().includes(normalizedQuery) ||
    site.website.toLowerCase().includes(normalizedQuery)
  );
}
