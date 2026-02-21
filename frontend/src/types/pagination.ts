export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isLoading: boolean;
}
