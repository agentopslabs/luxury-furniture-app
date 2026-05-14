'use client';

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Production-ready Axios client strictly for LeadConnector API V2.
 * Configured for client-side requests to services.leadconnectorhq.com.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GHL_API_BASE_URL || 'https://services.leadconnectorhq.com',
  headers: {
    'Content-Type': 'application/json',
    'Version': '2021-07-28',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Priority: Env token > localStorage
    const envToken = process.env.NEXT_PUBLIC_GHL_ACCESS_TOKEN;
    const storageToken = typeof window !== 'undefined' ? localStorage.getItem('ghl_access_token') : null;
    const token = envToken || storageToken;

    if (token && config.headers) {
      // Ensure "Bearer " prefix is correctly applied
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = bearerToken;
    }
    
    // Safety check for locationId in params
    if (config.params && !config.params.locationId) {
      const envLocation = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
      if (envLocation) {
        config.params.locationId = envLocation;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    // Silently handle common CORS/Network errors for prototypes
    if (error.message === 'Network Error') {
      console.warn('Network Error detected. This is likely a CORS restriction from GHL V2 when called directly from the client.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
