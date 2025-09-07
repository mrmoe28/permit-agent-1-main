'use client';

import { SearchResponse } from '@/types';
import { formatCurrency, formatAddress } from '@/lib/utils';
import { downloadPermitPDF } from '@/lib/pdf/generator';
import { 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  DollarSign, 
  FileText, 
  ExternalLink,
  AlertCircle,
  FilePlus,
  PaperclipIcon,
  CheckCircle2,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormsSection } from '@/components/dashboard/forms-section';

interface SearchResultsProps {
  results: SearchResponse;
  searchedAddress?: string;
}

export function SearchResults({ results, searchedAddress }: SearchResultsProps) {
  const { jurisdiction, permits, contact, processingInfo, forms } = results;

  // Debug logging
  console.log('SearchResults - Forms:', forms);
  console.log('SearchResults - Forms length:', forms?.length);
  console.log('SearchResults - Forms condition:', forms && forms.length > 0);


  const handlePrintResults = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Create a formatted address string from the search results
    const addressString = searchedAddress || formatAddress(jurisdiction.address);
    downloadPermitPDF(results, addressString);
  };

  const handleExportJSON = () => {
    const data = {
      jurisdiction: jurisdiction.name,
      website: jurisdiction.website,
      permits: permits.map(p => ({
        name: p.name,
        category: p.category,
        fees: p.fees.map(f => ({ type: f.type, amount: f.amount })),
        requirements: p.requirements
      })),
      contact: contact,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permit-info-${jurisdiction.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              {jurisdiction.name}
            </h1>
            <p className="text-gray-600 mt-2">
              {formatAddress(jurisdiction.address)}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <a
                href={jurisdiction.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Visit Website <ExternalLink className="h-4 w-4" />
              </a>
              {jurisdiction.permitUrl && (
                <a
                  href={jurisdiction.permitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Permit Portal <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintResults}>
              <FileText className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white">
              <FilePlus className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={handleExportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      {(contact.phone || contact.email || contact.hoursOfOperation) && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{contact.phone}</p>
                </div>
              </div>
            )}
            
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{contact.email}</p>
                </div>
              </div>
            )}
            
            {contact.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{formatAddress(contact.address)}</p>
                </div>
              </div>
            )}
          </div>
          
          {contact.hoursOfOperation && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-600" />
                Hours of Operation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(contact.hoursOfOperation).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize font-medium text-gray-900">{day}:</span>
                    <span className="text-gray-700">
                      {hours ? `${hours.open} - ${hours.close}` : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Permits */}
      {permits.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Available Permits ({permits.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {permits.map((permit, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{permit.name}</h3>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1 capitalize">
                      {permit.category}
                    </span>
                  </div>
                  {permit.processingTime && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Processing Time</p>
                      <p className="font-medium text-sm text-gray-900">{permit.processingTime}</p>
                    </div>
                  )}
                </div>
                
                {permit.description && (
                  <p className="text-gray-600 text-sm mb-3">{permit.description}</p>
                )}
                
                {permit.fees.length > 0 && (
                  <div className="mb-3">
                    <p className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Fees
                    </p>
                    <div className="space-y-1">
                      {permit.fees.map((fee, feeIndex) => (
                        <div key={feeIndex} className="flex justify-between text-sm">
                          <span className="text-gray-600">{fee.type}:</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(fee.amount)}
                            {fee.unit && fee.unit !== 'flat' && ` (${fee.unit})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {permit.requirements.length > 0 && (
                  <div>
                    <p className="font-medium text-sm text-gray-900 mb-2">Requirements:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {permit.requirements.map((req, reqIndex) => (
                        <li key={reqIndex} className="flex items-start gap-1">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downloadable Forms */}
      {forms && forms.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <PaperclipIcon className="h-5 w-5 text-blue-600" />
Application Forms ({forms.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map((form, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{form.name}</h3>
                      {form.isRequired && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <span className={`inline-block text-xs px-2 py-1 rounded ${
                      form.fileType === 'pdf' ? 'bg-red-100 text-red-800' :
                      form.fileType === 'doc' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {form.fileType.toUpperCase()}
                    </span>
                  </div>
                  <a
                    href={form.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </a>
                </div>
                
                {form.description && (
                  <p className="text-gray-600 text-sm mb-2">{form.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{form.isRequired ? 'Required' : 'Optional'}</span>
                  <span>Click to view</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-blue-600" />
              <span>
                Complete all required forms before submitting your permit application. 
                Contact the permit office if you need assistance with any forms.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Processing Information */}
      {processingInfo && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Processing Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processingInfo.averageTime && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Average Processing Time</h3>
                <p className="text-gray-600">{processingInfo.averageTime}</p>
              </div>
            )}
            
            {processingInfo.rushOptions && processingInfo.rushOptions.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Expedited Options</h3>
                <ul className="text-gray-600 space-y-1">
                  {processingInfo.rushOptions.map((option, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {processingInfo.inspectionSchedule && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Inspection Schedule</h3>
                <p className="text-gray-600">{processingInfo.inspectionSchedule}</p>
              </div>
            )}
            
            {processingInfo.appealProcess && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Appeal Process</h3>
                <p className="text-gray-600">{processingInfo.appealProcess}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forms Section */}
      {forms && forms.length > 0 && (
        <FormsSection
          forms={forms}
          jurisdictionName={jurisdiction.name}
        />
      )}

      {/* Data Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Important Notice</h3>
            <p className="text-yellow-700 text-sm mt-1">
              This information was automatically extracted from government websites and may not be 
              complete or current. Always verify permit requirements, fees, and procedures directly 
              with the jurisdiction before applying. Last updated: {new Date(jurisdiction.lastUpdated).toLocaleDateString()}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}