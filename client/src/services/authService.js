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
  console.log('AuthService: Checking stored token on getCurrentUser', !!token); // Debug log
  if (!token) { 
    console.log('AuthService: No token found in storage'); // Debug log
    return null;
  }

  try {
    console.log('AuthService: Making request to /auth/current-user'); // Debug log
    const response = await apiClient.get('/auth/current-user');
    console.log('AuthService: getCurrentUser success', response.data); // Debug log
    return response.data; 
  } catch (error) {
    console.error('AuthService: Failed to fetch current user', error.message);
    console.log('AuthService: Error status:', error.status); // Debug log
    if (error.status === 401) {
      console.log('AuthService: 401 error - clearing token'); // Debug log
      storeToken(null);
    }
    return null;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  getStoredToken, 
  storeToken,
};

export default authService;