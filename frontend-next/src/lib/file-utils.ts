import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Ensure upload directories exist
export const ensureUploadDirectories = async () => {
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  const projectsDir = join(uploadDir, 'projects');
  
  // Ensure base upload directory exists
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  
  // Ensure projects directory exists
  if (!existsSync(projectsDir)) {
    await mkdir(projectsDir, { recursive: true });
  }
  
  return {
    uploadDir,
    projectsDir
  };
};

// Generate a safe filename
export const generateSafeFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomString}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Check if file is an image
export const isImage = (fileType: string): boolean => {
  return fileType.startsWith('image/');
};

// Format file size
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}; 