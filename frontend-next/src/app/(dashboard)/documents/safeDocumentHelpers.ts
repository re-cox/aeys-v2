import { Document, DocumentType, DocumentCategory } from '@/types/document';
import { FileText } from 'lucide-react';
import { documentTypeConfig, documentCategoryConfig } from './utils';

/**
 * Safely get document type configuration with fallbacks
 * @param document The document object or document type
 * @returns A safe type configuration with guaranteed icon, label etc.
 */
export function getSafeTypeConfig(document: Document | DocumentType | undefined) {
  const docType = typeof document === 'string' 
    ? document as DocumentType
    : document?.type || DocumentType.OTHER;

  // Ensure we have a valid type config
  const typeConfig = documentTypeConfig[docType as DocumentType] || documentTypeConfig[DocumentType.OTHER] || {
    label: "Diğer",
    icon: FileText,
    colorClass: "text-gray-500"
  };
  
  return typeConfig;
}

/**
 * Safely get document category with fallbacks
 * @param document The document object or document category
 * @returns A safe category configuration with guaranteed icon, label etc.
 */
export function getSafeCategoryConfig(document: Document | DocumentCategory | undefined) {
  const category = typeof document === 'string'
    ? document as DocumentCategory
    : document?.category || DocumentCategory.GENERAL;
    
  // Ensure we have a valid category config
  const categoryConfig = documentCategoryConfig[category as DocumentCategory] || 
    documentCategoryConfig[DocumentCategory.GENERAL] || {
      label: "Genel",
      icon: FileText,
      colorClass: "text-gray-500"
    };
    
  return categoryConfig;
}

/**
 * Safely get file URL with proper formatting and fallbacks
 * @param document The document object or file URL
 * @returns A safe and formatted file URL
 */
export function getSafeFileUrl(document: Document | string | undefined): string {
  const fileUrl = typeof document === 'string'
    ? document
    : document?.fileUrl;
    
  if (!fileUrl) {
    return '#';
  }
  
  try {
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    } else if (fileUrl.startsWith('/uploads/')) {
      return `${window.location.origin}${fileUrl}`;
    } else if (fileUrl.startsWith('uploads/')) {
      return `${window.location.origin}/${fileUrl}`;
    } else {
      return `${window.location.origin}/uploads/${fileUrl}`;
    }
  } catch (error) {
    console.error('[Documents] Error processing URL:', error);
    return '#';
  }
}

/**
 * Check if a document has a valid file URL
 * @param document The document object
 * @returns True if the document has a valid file URL
 */
export function hasValidFileUrl(document: Document | undefined): boolean {
  return !!(document?.fileUrl && document.fileUrl !== '' && document.fileUrl !== '#');
}

/**
 * Get the appropriate file icon component for a document
 * @param document The document object
 * @returns A React component for the file icon
 */
export function getDocumentIcon(document: Document | DocumentType | undefined) {
  const typeConfig = getSafeTypeConfig(document);
  return typeConfig.icon || FileText;
} 