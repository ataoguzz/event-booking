const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 
         window.location.origin.replace(/:\d+$/, ':3001');
};

export const getImageUrl = (imageUrl, fallback = null) => {
  if (!imageUrl) return fallback;
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  if (imageUrl.startsWith('/')) {
    return `${getApiBaseUrl()}${imageUrl}`;
  }
  
  return `${getApiBaseUrl()}/${imageUrl}`;
};

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

export const processImageUrlsArray = (array, imageFields = []) => {
  if (!Array.isArray(array)) return array;
  
  return array.map(item => processImageUrls(item, imageFields));
}; 