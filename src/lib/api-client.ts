'use client';

import axios, { AxiosInstance } from 'axios';

/**
 * Client-side Axios instance for auxiliary requests.
 * Note: Core GHL V2 logic uses Server Actions to bypass CORS.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://services.leadconnectorhq.com',
  headers: {
    'Content-Type': 'application/json',
    'Version': '2021-07-28',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ghl_access_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
