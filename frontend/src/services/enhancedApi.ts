import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuth, useOrganization } from '@clerk/clerk-react';
import { errorService } from './errorService';
import { AppError, BackendErrorResponse } from '../types/errors';

export class EnhancedApiService {
  private static instance: EnhancedApiService;
  private api: AxiosInstance;
  private retryCount = new Map<string, number>();
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  public static getInstance(): EnhancedApiService {
    if (!EnhancedApiService.instance) {
      EnhancedApiService.instance = new EnhancedApiService();
    }
    return EnhancedApiService.instance;
  }

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        const { tenantId, plan } = this.getTenantInfo();

        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-Organization-Plan': plan,
          'Content-Type': 'application/json',
        } as any;

        config.headers['X-Correlation-ID'] = this.generateCorrelationId();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestKey = this.getRequestKey(response.config);
        this.retryCount.delete(requestKey);
        this.processUsageHeaders(response.headers);

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (!originalRequest) {
          return Promise.reject(error);
        }

        const requestKey = this.getRequestKey(originalRequest);
        const currentRetries = this.retryCount.get(requestKey) || 0;

        if (error.response) {
          const backendError = error.response.data as BackendErrorResponse;
          const appError = errorService.transformBackendError(backendError, error.response.status);

          errorService.logError(appError, {
            url: originalRequest.url,
            method: originalRequest.method,
            requestData: originalRequest.data,
          });

          if (error.response.status === 429 && currentRetries < this.maxRetries) {
            const retryAfter = backendError.details?.retryAfter || 1;
            await this.delay(retryAfter * 1000);

            this.retryCount.set(requestKey, currentRetries + 1);
            return this.api(originalRequest);
          }

          if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            // TODO: Implement token refresh logic
            return this.api(originalRequest);
          }

          errorService.displayError(appError);

          return Promise.reject(appError);
        } else if (error.request) {
          const networkError = errorService.transformNetworkError(error);

          errorService.logError(networkError, {
            url: originalRequest.url,
            method: originalRequest.method,
          });

          if (currentRetries < this.maxRetries && networkError.retryable) {
            await this.delay(this.retryDelay * Math.pow(2, currentRetries));

            this.retryCount.set(requestKey, currentRetries + 1);
            return this.api(originalRequest);
          }

          errorService.displayError(networkError);
          return Promise.reject(networkError);
        } else {
          const genericError: AppError = {
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred.',
            category: 'server',
            recoverable: false,
          };

          errorService.logError(genericError, {
            url: originalRequest.url,
            method: originalRequest.method,
            originalError: error.message,
          });

          errorService.displayError(genericError);
          return Promise.reject(genericError);
        }
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getAuthToken(): Promise<string> {
    try {
      if (typeof window !== 'undefined' && (window as any).Clerk) {
        const clerk = (window as any).Clerk;
        if (clerk.session && clerk.session.getToken) {
          return await clerk.session.getToken({ template: 'spring-boot-backend' });
        }
      }

      return 'dev-token';
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return 'dev-token';
    }
  }

  private getTenantInfo(): { tenantId: string; plan: string } {
    try {
      if (typeof window !== 'undefined' && (window as any).Clerk) {
        const clerk = (window as any).Clerk;
        if (clerk.organization) {
          return {
            tenantId: clerk.organization.id || 'personal',
            plan: (clerk.organization.publicMetadata?.plan as string) || 'free'
          };
        }
      }

      return { tenantId: 'personal', plan: 'free' };
    } catch (error) {
      console.warn('Failed to get tenant info:', error);
      return { tenantId: 'personal', plan: 'free' };
    }
  }

  private getRequestKey(config: AxiosRequestConfig): string {
    return `${config.method}_${config.url}_${JSON.stringify(config.data)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private processUsageHeaders(headers: any): void {
    const processHeader = (headerName: string, type: 'sku' | 'ai') => {
      const val = headers[headerName.toLowerCase()] || headers[headerName];
      if (val && typeof val === 'string') {
        const [curr, lim] = val.split('/').map(Number);
        // TODO: Update global usage state
        console.log(`Usage ${type}: ${curr}/${lim}`);
      }
    };

    processHeader('X-Usage-SKU', 'sku');
    processHeader('X-Usage-AI', 'ai');
  }

  getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  clearRetryCounts(): void {
    this.retryCount.clear();
  }
}

export const enhancedApi = EnhancedApiService.getInstance();
