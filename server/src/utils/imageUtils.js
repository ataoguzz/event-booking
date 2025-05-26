// Helper function to handle both local and external image URLs
export const getImageUrl = (imageUrl, fallback = null) => {
  if (!imageUrl) return fallback;
  
  // If it's already a full URL (starts with http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a local path (starts with /), prepend server URL
  const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3001';
  if (imageUrl.startsWith('/')) {
    return `${SERVER_BASE_URL}${imageUrl}`;
  }
  
  // Otherwise, assume it's a local path and prepend server URL
  return `${SERVER_BASE_URL}/${imageUrl}`;
};

// Helper function to process an object with image URLs
export const processImageUrls = (obj, imageFields = []) => {
  if (!obj) return obj;
  
  const processed = { ...obj };
  
  imageFields.forEach(field => {
    if (processed[field]) {
      processed[field] = getImageUrl(processed[field]);
    }
  });
  
  return processed;
};

// Helper function to process an array of objects with image URLs
export const processImageUrlsArray = (array, imageFields = []) => {
  if (!Array.isArray(array)) return array;
  
  return array.map(item => processImageUrls(item, imageFields));
}; 