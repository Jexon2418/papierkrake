import { useState, useCallback, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { InsertUser } from "@shared/schema";

// Define auth user type
export type AuthUser = {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
};

// Simple auth state that's globally accessible
let globalAuthState = {
  user: null as AuthUser | null,
  isAuthenticated: false,
};

// Global auth state subscribers
const subscribers: (() => void)[] = [];

// Update the global auth state
function updateAuthState(user: AuthUser | null) {
  globalAuthState = {
    user,
    isAuthenticated: !!user,
  };
  // Notify all subscribers
  subscribers.forEach(callback => callback());
}

/**
 * Auth hook that provides authentication functionality
 */
export function useAuth() {
  const [authState, setAuthState] = useState(globalAuthState);

  // Subscribe to auth state changes
  useEffect(() => {
    // Create subscriber function
    const handleChange = () => {
      setAuthState({ ...globalAuthState });
    };
    
    // Add subscriber
    subscribers.push(handleChange);
    
    // Clean up subscription
    return () => {
      const index = subscribers.indexOf(handleChange);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  }, []);

  // Check if user is authenticated
  const initialize = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Attempt to validate token by requesting user data
      const response = await apiRequest('GET', '/api/user');
      const userData = await response.json();
      updateAuthState(userData.user);
    } catch (error) {
      // Token is invalid, clear storage
      localStorage.removeItem('token');
      updateAuthState(null);
    }
  }, []);

  // Login function
  const login = useCallback(async (username: string, password: string) => {
    const response = await apiRequest('POST', '/api/login', { username, password });
    const data = await response.json();
    
    // Save token to localStorage
    localStorage.setItem('token', data.token);
    
    // Update auth state
    updateAuthState(data.user);
  }, []);

  // Register function
  const register = useCallback(async (userData: InsertUser) => {
    const response = await apiRequest('POST', '/api/register', userData);
    const data = await response.json();
    
    // Save token to localStorage
    localStorage.setItem('token', data.token);
    
    // Update auth state
    updateAuthState(data.user);
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    // Update auth state
    updateAuthState(null);
  }, []);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    login,
    register,
    logout,
    initialize,
  };
}
