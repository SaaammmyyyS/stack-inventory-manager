export interface AppError {
  code: string;
  message: string;
  details?: any;
  correlationId?: string;
  category: 'validation' | 'business' | 'network' | 'auth' | 'server';
  recoverable: boolean;
  timestamp?: string;
  path?: string;
  authType?: 'unauthorized' | 'forbidden' | 'expired' | 'invalid';
  retryable?: boolean;
  retryAfter?: number;
  status?: number;
  statusText?: string;
}

export interface ValidationError extends AppError {
  category: 'validation';
  field: string;
  rejectedValue: any;
  reason: string;
}

export interface BusinessError extends AppError {
  category: 'business';
  businessRule: string;
}

export interface NetworkError extends AppError {
  category: 'network';
  status?: number;
  statusText?: string;
  retryable: boolean;
  retryAfter?: number;
}

export interface AuthError extends AppError {
  category: 'auth';
  authType: 'unauthorized' | 'forbidden' | 'expired' | 'invalid';
}

export interface ServerError extends AppError {
  category: 'server';
  stackTrace?: string;
}

export type ErrorCategory = AppError['category'];

export interface ErrorState {
  error: AppError | null;
  isLoading: boolean;
  hasError: boolean;
}

export interface ErrorAction {
  type: 'SET_ERROR' | 'CLEAR_ERROR' | 'RETRY';
  payload?: AppError;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  tenantId?: string;
}

export interface BackendErrorResponse {
  timestamp: string;
  correlationId: string;
  status: number;
  error: string;
  message: string;
  details?: any;
  path: string;
}
