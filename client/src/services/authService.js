// client/src/services/authService.js
import apiClient from '../helpers/apiCore.js';
import { jwtDecode } from "jwt-decode"; 

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
  if (!token || !isTokenValid(token)) { 
    if (token) storeToken(null); 
    return null;
  }

  try {
    const response = await apiClient.get('/auth/me');
    return response.data; 
  } catch (error) {
    console.error('AuthService: Failed to fetch current user', error.message);
    if (error.status === 401) {
      storeToken(null);
    }
    return null;
  }
};


const isTokenValid = (token) => {
  const currentToken = token || getStoredToken();
  if (!currentToken) {
    return false;
  }
  try {
    const decoded = jwtDecode(currentToken);
    const currentTime = Date.now() / 1000; 
    if (decoded.exp < currentTime) {
      console.warn("AuthService: Token expired (client-side check).");
      return false;
    }
    return true;
  } catch (e) {
    console.error("AuthService: Failed to decode token.", e);
    return false; 
  }
};


const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  getStoredToken, 
  storeToken, 
  isTokenValid, 
};

export default authService;