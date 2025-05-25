import apiClient from '../helpers/apiCore.js';

/**
 * Update the organizer profile information
 * @param {Object} profileData - The profile data to update (display_name, bio, email)
 * @returns {Promise<Object>} - The updated profile data
 */
const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/organizer/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('OrganizerService: Failed to update profile', error.message);
    throw error;
  }
};

/**
 * Upload a profile image for the organizer
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<Object>} - The response containing the profile with updated avatar_url
 */
const uploadProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Create a custom config to override the default Content-Type
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await apiClient.post('/organizer/profile-image', formData, config);
    return response.data;
  } catch (error) {
    console.error('OrganizerService: Failed to upload profile image', error.message);
    throw error;
  }
};

/**
 * Get the organizer's profile information
 * @returns {Promise<Object>} - The organizer profile data
 */
const getProfile = async () => {
  try {
    const response = await apiClient.get('/organizer/profile');
    return response.data;
  } catch (error) {
    console.error('OrganizerService: Failed to get profile', error.message);
    throw error;
  }
};

/**
 * Get a public organizer profile by ID (for attendees viewing organizer profiles)
 * @param {string|number} organizerId - The ID of the organizer to fetch
 * @returns {Promise<Object>} - The public organizer profile data
 */
const getPublicProfile = async (organizerId) => {
  try {
    console.log(`[OrganizerService] Fetching public profile for organizer ID: ${organizerId}`);
    const endpoint = `/organizer/${organizerId}`;
    console.log(`[OrganizerService] Making API request to: ${endpoint}`);
    
    const response = await apiClient.get(endpoint);
    console.log(`[OrganizerService] Response received:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[OrganizerService] Failed to get public profile for organizer ${organizerId}`, error);
    throw error;
  }
};

/**
 * Toggle following an organizer
 * @param {string|number} organizerId - The ID of the organizer to follow/unfollow
 * @param {boolean} isFollowing - Whether the user is currently following the organizer
 * @returns {Promise<Object>} - The response from the server
 */
const toggleFollow = async (organizerId, isFollowing) => {
  try {
    let response;
    if (isFollowing) {
      response = await apiClient.delete(`/users/organizers/follow/${organizerId}`);
    } else {
      response = await apiClient.post(`/users/organizers/follow/${organizerId}`);
    }
    return response.data;
  } catch (error) {
    console.error(`OrganizerService: Failed to ${isFollowing ? 'unfollow' : 'follow'} organizer ${organizerId}`, error.message);
    throw error;
  }
};

const organizerService = {
  updateProfile,
  uploadProfileImage,
  getProfile,
  getPublicProfile,
  toggleFollow
};

export default organizerService; 