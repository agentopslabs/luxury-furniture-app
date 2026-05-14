
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
    // Priority: Explicit token > localStorage > env
    const envToken = process.env.NEXT_PUBLIC_GHL_ACCESS_TOKEN;
    const storageToken = typeof window !== 'undefined' ? localStorage.getItem('ghl_access_token') : null;
    const token = storageToken || envToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
