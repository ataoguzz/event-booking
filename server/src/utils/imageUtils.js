export const getImageUrl = (imageUrl, fallback = null) => {
  if (!imageUrl) return fallback;
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3001';
  if (imageUrl.startsWith('/')) {
    return `${SERVER_BASE_URL}${imageUrl}`;
  }
  
  return `${SERVER_BASE_URL}/${imageUrl}`;
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