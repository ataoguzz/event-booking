import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/authService'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [isLoading, setIsLoading] = useState(true); 

  const verifyAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.getCurrentUser(); 
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        authService.storeToken(null); 
      }
    } catch (error) {
      console.error("AuthContext: Error verifying auth status", error);
      setUser(null);
      setIsAuthenticated(false);
      authService.storeToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAuthStatus(); 
  }, [verifyAuthStatus]);


  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials); 
      setUser(data.user);
      setIsAuthenticated(true);
      return data; 
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      authService.storeToken(null); 
      throw error; 
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData); 
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      authService.storeToken(null);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    await authService.logout(); // Clears token and calls backend
    setUser(null);
    setIsAuthenticated(false);

  };

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    verifyAuthStatus, 
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};