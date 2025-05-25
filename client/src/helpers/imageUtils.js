/**
 * Utility function to convert relative avatar URLs to absolute URLs
 * @param {string} avatarUrl - The avatar URL from the API (could be relative or absolute)
 * @returns {string} - Absolute URL for the avatar image
 */
export const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) {
    return "https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png";
  }
  
  // If it's already an absolute URL, return as is
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  // If it's a relative URL starting with /uploads/, convert to absolute
  if (avatarUrl.startsWith('/uploads/')) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 
                       window.location.origin.replace(/:\d+$/, ':3001');
    return `${apiBaseUrl}${avatarUrl}`;
  }
  
  // Fallback to placeholder
  return "https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png";
};

/**
 * Utility function to convert relative image URLs to absolute URLs
 * @param {string} imageUrl - The image URL from the API (could be relative or absolute)
 * @returns {string} - Absolute URL for the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return null;
  }
  
  // If it's already an absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative URL starting with /uploads/, convert to absolute
  if (imageUrl.startsWith('/uploads/')) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 
                       window.location.origin.replace(/:\d+$/, ':3001');
    return `${apiBaseUrl}${imageUrl}`;
  }
  
  // Return as is for other cases
  return imageUrl;
}; 