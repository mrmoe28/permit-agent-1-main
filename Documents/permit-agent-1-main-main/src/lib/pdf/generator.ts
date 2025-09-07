import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SearchResponse } from '@/types';
import { formatCurrency, formatAddress } from '@/lib/utils';

interface PDFGeneratorOptions {
  searchResults: SearchResponse;
  addressSearched: string;
}

export function generatePermitPDF({ searchResults, addressSearched }: PDFGeneratorOptions): jsPDF {
  const { jurisdiction, permits, contact, processingInfo } = searchResults;
  const doc = new jsPDF();
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };
  
  // Helper function to add section header
  const addSectionHeader = (title: string) => {
    checkNewPage(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41); // Dark gray
    doc.text(title, margin, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  };
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('Permit Information Report', margin, yPosition);
  yPosition += 10;
  
  // Date and Address
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // Gray
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Property Address: ${addressSearched}`, margin, yPosition);
  yPosition += 15;
  
  // Jurisdiction Information
  addSectionHeader('Jurisdiction Information');
  doc.setTextColor(0, 0, 0);
  doc.text(jurisdiction.name, margin, yPosition);
  yPosition += 5;
  doc.text(formatAddress(jurisdiction.address), margin, yPosition);
  yPosition += 5;
  
  // Make website clickable
  doc.setTextColor(37, 99, 235);
  doc.textWithLink('Website: ' + jurisdiction.website, margin, yPosition, {
    url: jurisdiction.website
  });
  yPosition += 5;
  
  if (jurisdiction.permitUrl) {
    doc.textWithLink('Permit Portal: ' + jurisdiction.permitUrl, margin, yPosition, {
      url: jurisdiction.permitUrl
    });
    yPosition += 5;
  }
  yPosition += 10;
  
  // Contact Information
  if (contact.phone || contact.email || contact.address) {
    addSectionHeader('Contact Information');
    doc.setTextColor(0, 0, 0);
    
    if (contact.phone) {
      doc.text(`Phone: ${contact.phone}`, margin, yPosition);
      yPosition += 5;
    }
    
    if (contact.email) {
      doc.text(`Email: ${contact.email}`, margin, yPosition);
      yPosition += 5;
    }
    
    if (contact.address) {
      doc.text(`Office: ${formatAddress(contact.address)}`, margin, yPosition);
      yPosition += 5;
    }
    
    // Hours of Operation
    if (contact.hoursOfOperation) {
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Hours of Operation:', margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      
      Object.entries(contact.hoursOfOperation).forEach(([day, hours]) => {
        const dayText = day.charAt(0).toUpperCase() + day.slice(1);
        const hoursText = hours ? `${hours.open} - ${hours.close}` : 'Closed';
        doc.text(`${dayText}: ${hoursText}`, margin + 5, yPosition);
        yPosition += 4;
      });
    }
    yPosition += 10;
  }
  
  // Permits Section
  if (permits.length > 0) {
    addSectionHeader(`Available Permits (${permits.length})`);
    
    permits.forEach((permit, index) => {
      // Check if we need a new page for this permit
      checkNewPage(60);
      
      // Permit Name and Category
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${permit.name}`, margin, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
      doc.text(`Category: ${permit.category}`, margin + 5, yPosition);
      yPosition += 5;
      doc.setTextColor(0, 0, 0);
      
      // Description
      if (permit.description) {
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(permit.description, contentWidth - 10);
        doc.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 4;
      }
      
      // Processing Time
      if (permit.processingTime) {
        doc.text(`Processing Time: ${permit.processingTime}`, margin + 5, yPosition);
        yPosition += 5;
      }
      
      // Fees Table
      if (permit.fees.length > 0) {
        yPosition += 3;
        const feeData = permit.fees.map(fee => [
          fee.type,
          formatCurrency(fee.amount) + (fee.unit && fee.unit !== 'flat' ? ` (${fee.unit})` : '')
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Fee Type', 'Amount']],
          body: feeData,
          theme: 'grid',
          headStyles: { 
            fillColor: [37, 99, 235],
            fontSize: 9
          },
          bodyStyles: { 
            fontSize: 9
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 50 }
          },
          margin: { left: margin + 5, right: margin }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 5;
      }
      
      // Requirements
      if (permit.requirements.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Requirements:', margin + 5, yPosition);
        yPosition += 4;
        doc.setFont('helvetica', 'normal');
        
        permit.requirements.forEach(req => {
          checkNewPage(10);
          const lines = doc.splitTextToSize(`• ${req}`, contentWidth - 15);
          doc.text(lines, margin + 8, yPosition);
          yPosition += lines.length * 4;
        });
      }
      
      yPosition += 8;
    });
  }
  
  // Processing Information
  if (processingInfo) {
    checkNewPage(40);
    addSectionHeader('Processing Information');
    doc.setTextColor(0, 0, 0);
    
    if (processingInfo.averageTime) {
      doc.text(`Average Processing Time: ${processingInfo.averageTime}`, margin, yPosition);
      yPosition += 5;
    }
    
    if (processingInfo.rushOptions && processingInfo.rushOptions.length > 0) {
      doc.text('Expedited Options:', margin, yPosition);
      yPosition += 5;
      processingInfo.rushOptions.forEach(option => {
        const lines = doc.splitTextToSize(`• ${option}`, contentWidth - 10);
        doc.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 4;
      });
      yPosition += 3;
    }
    
    if (processingInfo.inspectionSchedule) {
      doc.text(`Inspection Schedule: ${processingInfo.inspectionSchedule}`, margin, yPosition);
      yPosition += 5;
    }
    
    if (processingInfo.appealProcess) {
      const lines = doc.splitTextToSize(`Appeal Process: ${processingInfo.appealProcess}`, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 4;
    }
  }
  
  // Disclaimer
  checkNewPage(30);
  yPosition += 10;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // Light gray
  doc.setFont('helvetica', 'italic');
  const disclaimerText = 'This information was automatically extracted from government websites and may not be complete or current. Always verify permit requirements, fees, and procedures directly with the jurisdiction before applying.';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(disclaimerLines, margin, yPosition);
  
  // Footer on each page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages} | PermitAgent Report | ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  return doc;
}

export function downloadPermitPDF(searchResults: SearchResponse, addressSearched: string) {
  const pdf = generatePermitPDF({ searchResults, addressSearched });
  const fileName = `permit-info-${searchResults.jurisdiction.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().getTime()}.pdf`;
  pdf.save(fileName);
}