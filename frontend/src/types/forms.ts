export interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  minThreshold?: number;
}

export interface ProductUpdateFormState {
  name: string;
  sku: string;
  category: string;
  price: string;
  minThreshold: string;
}

export interface ProductUpdateData extends Partial<ProductFormData> {
  id: string;
}

export interface FormSubmitHandler<T = ProductFormData> {
  (data: T): void | Promise<void>;
}

export interface FormState<T = ProductFormData> {
  data: T;
  isSubmitting: boolean;
  error?: string | null;
}
