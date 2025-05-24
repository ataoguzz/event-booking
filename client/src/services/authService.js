// client/src/services/authService.js
import apiClient from '../helpers/apiCore.js';

const AUTH_SESSION_KEY = "authToken"; 

const storeToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_SESSION_KEY, token);
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
};

const getStoredToken = () => {
  return localStorage.getItem(AUTH_SESSION_KEY);
};

const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data && response.data.token) {
      storeToken(response.data.token);
    }
    return response.data; 
  } catch (error) {
    console.error('AuthService: Registration failed', error.message); 
    throw error; 
  }
};

const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data && response.data.token) {
      storeToken(response.data.token);
    }
    return response.data; 
  } catch (error) {
    console.error('AuthService: Login failed', error.message);
    throw error;
  }
};

const logout = async () => {
  storeToken(null); 
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.warn('AuthService: Backend logout call failed', error.message);
  }
};

const getCurrentUser = async () => {
  const token = getStoredToken();
  if (!token) { 
    return null;
  }

  try {
    const response = await apiClient.get('/auth/current-user');
    return response.data; 
  } catch (error) {
    console.error('AuthService: Failed to fetch current user', error.message);
    if (error.status === 401) {
      storeToken(null);
    }
    return null;
  }
};

const updateOrganizerProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/user/organizers/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('AuthService: Failed to update organizer profile', error.message);
    throw error;
  }
};

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
    
    const response = await apiClient.post('/user/organizers/profile-image', formData, config);
    return response.data;
  } catch (error) {
    console.error('AuthService: Failed to upload profile image', error.message);
    throw error;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  getStoredToken, 
  storeToken,
  updateOrganizerProfile,
  uploadProfileImage,
};

export default authService;