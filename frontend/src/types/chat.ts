export type MessageRole = 'user' | 'assistant';

export type MessageType = 'text' | 'transactions' | 'inventory' | 'forecast' | 'processing' | 'conversational';

export interface Message {
  role: MessageRole;
  content: string;
  type?: MessageType;
  data?: any;
  isProcessing?: boolean;
  debugInfo?: any;
}

export interface ChatState {
  messages: Message[];
  input: string;
  isLoading: boolean;
  debugMode: boolean;
  open: boolean;
}

export interface ChatResponse {
  type: MessageType;
  content: string;
  data?: any;
  isProcessing?: boolean;
  debugInfo?: any;
}

export interface DebugInfo {
  source: string;
  parsed?: any;
  intent?: string;
  entities?: Record<string, any>;
  data?: any;
  fragments?: any[];
  merged?: any;
  message?: string;
  originalContent?: string;
}

export interface TransactionItem {
  id?: string;
  itemId?: string;
  itemName?: string;
  type: 'STOCK_IN' | 'STOCK_OUT';
  amount: number;
  performedBy?: string;
  reason?: string;
  createdAt?: string;
}

export interface InventoryItem {
  id?: string;
  name?: string;
  quantity: number;
  sku?: string;
  minThreshold?: number;
}

export interface ForecastItem {
  itemName?: string;
  name?: string;
  daysRemaining?: number;
  days_remaining?: number;
  currentQuantity?: number;
  current_quantity?: number;
  sku?: string;
  healthStatus?: string;
  health_status?: string;
  suggestedThreshold?: number;
  suggested_threshold?: number;
  runoutDate?: string;
}

export interface ParsedResponse {
  debug?: {
    intent?: string;
    entities?: Record<string, any>;
  };
  data?: {
    data?: any[];
    items?: any[];
    summary?: string;
    status?: string;
    summary_text?: string;
    health_score?: number;
    urgent_actions?: string[];
  };
  items?: any[];
  responseData?: any[];
  summary?: string;
}

export type ProcessingState = {
  isProcessing: boolean;
  content: string;
};

export const WELCOME_MESSAGE = "I'm your Inventory Management Agent. Ask me about stock levels, recent movements, item forecasts, or to record a stock adjustment.";
