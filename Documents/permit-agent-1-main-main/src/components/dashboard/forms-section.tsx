'use client';

import { useState } from 'react';
import { PermitForm } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  FileText, 
  File, 
  Search,
  Star,
  Globe
} from 'lucide-react';

interface FormsSectionProps {
  forms: PermitForm[];
  jurisdictionName: string;
}

export function FormsSection({ 
  forms, 
  jurisdictionName
}: FormsSectionProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique file types
  const fileTypes = Array.from(new Set(forms.map(f => f.fileType)));

  // Filter forms
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || form.fileType === filterType;
    
    return matchesSearch && matchesType;
  });

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-600" />;
      case 'doc':
      case 'docx': return <File className="h-5 w-5 text-blue-600" />;
      case 'xls':
      case 'xlsx': return <File className="h-5 w-5 text-green-600" />;
      case 'online': return <Globe className="h-5 w-5 text-purple-600" />;
      default: return <File className="h-5 w-5 text-gray-600" />;
    }
  };


  if (forms.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Available Forms</h3>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-medium">No downloadable forms found</p>
          <p className="text-sm">Contact {jurisdictionName} directly for application forms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Available Forms ({forms.length})
        </h3>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All File Types</option>
          {fileTypes.map(type => (
            <option key={type} value={type}>
              {type.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Forms List */}
      <div className="space-y-4">
        {filteredForms.map((form) => (
          <div
            key={form.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* File Icon */}
              <div className="mt-1">
                {getFileIcon(form.fileType)}
              </div>
              
              {/* Form Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 mb-1">
                      {form.name}
                    </h4>
                    
                    {form.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {form.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Required Badge */}
                      {form.isRequired && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          <Star className="h-3 w-3" />
                          Required
                        </span>
                      )}
                      
                      {/* File Type Badge */}
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {form.fileType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={() => window.open(form.url, '_blank')}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {form.fileType === 'online' ? 'Open Form' : 'View Form'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredForms.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-medium">No forms match your search</p>
          <p className="text-sm">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}