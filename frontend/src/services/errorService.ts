import { AppError, BackendErrorResponse, ErrorCategory, ValidationError, BusinessError, NetworkError, AuthError, ServerError } from '../types/errors';
import { toast } from 'sonner';

export class ErrorService {
  private static instance: ErrorService;

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  transformBackendError(backendError: BackendErrorResponse, statusCode: number): AppError {
    const category = this.categorizeError(backendError.error, statusCode);
    const baseError: Partial<AppError> = {
      code: backendError.error,
      message: backendError.message,
      details: backendError.details,
      correlationId: backendError.correlationId,
      timestamp: backendError.timestamp,
      path: backendError.path,
      recoverable: this.isRecoverable(category, statusCode),
    };

    switch (category) {
      case 'validation':
        return {
          ...baseError,
          category: 'validation',
          field: backendError.details?.field || 'unknown',
          rejectedValue: backendError.details?.rejectedValue,
          reason: backendError.details?.reason || backendError.message,
        } as ValidationError;

      case 'business':
        return {
          ...baseError,
          category: 'business',
          businessRule: backendError.error,
        } as BusinessError;

      case 'network':
        return {
          ...baseError,
          category: 'network',
          status: statusCode,
          statusText: this.getStatusText(statusCode),
          retryable: statusCode >= 500 || statusCode === 429,
          retryAfter: backendError.details?.retryAfter,
        } as NetworkError;

      case 'auth':
        return {
          ...baseError,
          category: 'auth',
          authType: this.getAuthType(statusCode, backendError.error),
        } as AuthError;

      case 'server':
      default:
        return {
          ...baseError,
          category: 'server',
          stackTrace: backendError.details?.stackTrace,
        } as ServerError;
    }
  }

  transformNetworkError(error: any): NetworkError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Could not reach the server. Please check your internet connection.',
        category: 'network',
        recoverable: true,
        retryable: true,
        status: 0,
        statusText: 'Network Error',
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Request timed out. Please try again.',
        category: 'network',
        recoverable: true,
        retryable: true,
        status: 0,
        statusText: 'Timeout',
      };
    }

    return {
      code: 'UNKNOWN_NETWORK_ERROR',
      message: 'An unexpected network error occurred.',
      category: 'network',
      recoverable: false,
      retryable: false,
      status: 0,
      statusText: 'Unknown',
      details: { originalError: error.message },
    };
  }

  displayError(error: AppError, context?: string): void {
    const title = this.getErrorTitle(error);
    const description = this.getErrorDescription(error, context);

    switch (error.category) {
      case 'validation':
        toast.error(title, {
          description,
          action: {
            label: 'Fix',
            onClick: () => this.focusField(error as ValidationError),
          },
        });
        break;

      case 'business':
        toast.warning(title, {
          description,
        });
        break;

      case 'auth':
        toast.error(title, {
          description,
          action: error.authType === 'expired' ? {
            label: 'Login',
            onClick: () => this.handleAuthError(error as AuthError),
          } : undefined,
        });
        break;

      case 'network':
        if (error.retryable) {
          toast.error(title, {
            description,
            action: {
              label: 'Retry',
              onClick: () => this.retryRequest(error),
            },
          });
        } else {
          toast.error(title, { description });
        }
        break;

      case 'server':
        toast.error(title, {
          description: error.correlationId
            ? `${description} (ID: ${error.correlationId})`
            : description,
        });
        break;

      default:
        toast.error('Error', { description: error.message });
    }
  }

  logError(error: AppError, context?: any): void {
    const logData = {
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    if (error.category === 'server' || error.category === 'network') {
      console.error('Application Error:', logData);
    } else {
      console.warn('Application Warning:', logData);
    }

    // TODO: Send to error tracking service (Sentry, etc.)
  }

  private categorizeError(errorCode: string, statusCode: number): ErrorCategory {
    if (statusCode === 400 || errorCode.includes('VALIDATION')) {
      return 'validation';
    }
    if (statusCode === 401 || statusCode === 403 || errorCode.includes('AUTH')) {
      return 'auth';
    }
    if (statusCode === 409 || errorCode.includes('CONFLICT') || errorCode.includes('BUSINESS')) {
      return 'business';
    }
    if (statusCode >= 500) {
      return 'server';
    }
    if (statusCode === 429 || (statusCode >= 400 && statusCode < 500)) {
      return 'network';
    }
    return 'server';
  }

  private isRecoverable(category: ErrorCategory, statusCode: number): boolean {
    switch (category) {
      case 'validation':
      case 'business':
        return true;
      case 'network':
        return statusCode === 429 || statusCode >= 500;
      case 'auth':
        return statusCode === 401;
      case 'server':
        return false;
      default:
        return false;
    }
  }

  private getErrorTitle(error: AppError): string {
    switch (error.category) {
      case 'validation':
        return 'Validation Error';
      case 'business':
        return 'Business Rule Violation';
      case 'auth':
        return 'Authentication Error';
      case 'network':
        return 'Connection Error';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  }

  private getErrorDescription(error: AppError, context?: string): string {
    if (error.category === 'validation' && context) {
      return `${error.message} in ${context}`;
    }
    return error.message;
  }

  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    return statusTexts[status] || 'Unknown';
  }

  private getAuthType(status: number, errorCode: string): AuthError['authType'] {
    if (status === 401 || errorCode.includes('UNAUTHORIZED')) {
      return 'unauthorized';
    }
    if (status === 403 || errorCode.includes('FORBIDDEN')) {
      return 'forbidden';
    }
    if (errorCode.includes('EXPIRED')) {
      return 'expired';
    }
    return 'invalid';
  }

  private focusField(error: ValidationError): void {
    const field = document.querySelector(`[name="${error.field}"]`) as HTMLInputElement;
    if (field) {
      field.focus();
      field.select();
    }
  }

  private handleAuthError(error: AuthError): void {
    // TODO: Redirect to login or refresh token
    window.location.href = '/login';
  }

  private retryRequest(error: AppError): void {
    // TODO: Implement retry logic
    console.log('Retrying request for error:', error);
  }
}

export const errorService = ErrorService.getInstance();
