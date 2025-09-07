'use client';

import { useState } from 'react';
import { EnhancedAddressSearch } from '@/components/forms/enhanced-address-search';
import { ProfileIcon } from '@/components/profile-icon';
import { SearchResults } from '@/components/dashboard/search-results';
import { SearchResponse } from '@/types';
import { Building2, Search, FileText, Clock, AlertTriangle } from 'lucide-react';

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedAddress, setSearchedAddress] = useState<string>('');

  const handleSearchResults = (results: SearchResponse, address?: string) => {
    setSearchResults(results);
    setSearchError(null);
    if (address) {
      setSearchedAddress(address);
    }
  };

  const handleSearchError = (error: string) => {
    setSearchError(error);
    setSearchResults(null);
  };

  const handleNewSearch = () => {
    setSearchResults(null);
    setSearchError(null);
    setSearchedAddress('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-600">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PermitAgent</h1>
                <p className="text-gray-600 text-sm">Find permit information for any address</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProfileIcon />
            {searchResults && (
              <button
                onClick={handleNewSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                New Search
              </button>
            )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!searchResults && !searchError && (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Streamline Your Permit Research
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Enter any property address to automatically discover local permit requirements, 
                fees, application procedures, and contact information from government websites.
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <Search className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Automatic Discovery</h3>
                  <p className="text-gray-600 text-sm">
                    We find and analyze the correct local jurisdiction websites for your address
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Complete Information</h3>
                  <p className="text-gray-600 text-sm">
                    Get permit types, fees, requirements, and application forms in one place
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Save Time</h3>
                  <p className="text-gray-600 text-sm">
                    Skip hours of research and get organized permit information instantly
                  </p>
                </div>
              </div>
            </div>

            {/* Search Form */}
            <EnhancedAddressSearch 
              onSearchResults={handleSearchResults}
              onSearchError={handleSearchError}
            />
          </>
        )}

        {/* Error State */}
        {searchError && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Search Failed</h3>
                  <p className="text-red-700 mb-4">{searchError}</p>
                  <button
                    onClick={handleNewSearch}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <SearchResults results={searchResults} searchedAddress={searchedAddress} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              PermitAgent helps contractors and property owners find permit information quickly and accurately.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Always verify permit requirements directly with your local jurisdiction before applying.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
