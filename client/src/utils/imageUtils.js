// Get API base URL from environment or window location
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 
         window.location.origin.replace(/:\d+$/, ':3001');
};

// Helper function to ensure image URLs are absolute
export const getImageUrl = (imageUrl, fallback = null) => {
  if (!imageUrl) return fallback;
  
  // If it's already a full URL (starts with http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a local path (starts with /), prepend API base URL
  if (imageUrl.startsWith('/')) {
    return `${getApiBaseUrl()}${imageUrl}`;
  }
  
  // Otherwise, assume it's a local path and prepend API base URL
  return `${getApiBaseUrl()}/${imageUrl}`;
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