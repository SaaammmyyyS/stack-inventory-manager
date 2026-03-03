export type MessageRole = 'user' | 'assistant';

export type MessageType = 'text' | 'transactions' | 'inventory' | 'forecast' | 'processing' | 'conversational';

export interface ForecastStatus {
  color: 'green' | 'yellow' | 'red' | 'gray' | 'orange';
  label: 'STABLE' | 'WARNING' | 'CRITICAL' | 'UNKNOWN' | 'CAUTION';
  days: number;
}

export interface Message {
  role: MessageRole;
  content: string;
  type?: MessageType;
  data?: unknown;
  isProcessing?: boolean;
  debugInfo?: DebugInfo;
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
  data?: unknown;
  isProcessing?: boolean;
  debugInfo?: DebugInfo;
}

export interface DebugResponseData {
  intent?: string;
  entities?: Record<string, unknown>;
  parsed?: ParsedResponse;
  fragments?: unknown[];
  merged?: unknown;
  error?: string;
}

export interface DebugInfo {
  source: string;
  parsed?: DebugResponseData;
  intent?: string;
  entities?: Record<string, unknown>;
  data?: unknown;
  fragments?: unknown[];
  merged?: unknown;
  message?: string;
  originalContent?: string;
  error?: string;
}

export interface TransactionItem {
  id?: string;
  itemId?: string;
  itemName?: string;
  performedBy?: string;
  amount?: number;
  createdAt?: string;
  itemname?: string;
  performedby?: string;
  quantitychange?: number;
  createdat?: string;

  type: 'STOCK_IN' | 'STOCK_OUT';
  reason?: string;
}

export interface InventoryItem {
  id?: string;
  name: string;
  quantity: number;
  sku?: string;
  minThreshold?: number;
}

export interface ForecastItem {
  itemName?: string;
  daysRemaining?: number;
  currentQuantity?: number;
  sku?: string;
  healthStatus?: string;
  suggestedThreshold?: number;
  runoutDate?: string;
  name?: string;
  days_remaining?: number;
  current_quantity?: number;
  health_status?: string;
  suggested_threshold?: number;
}

export interface ParsedResponse {
  debug?: {
    intent?: string;
    entities?: Record<string, unknown>;
  };
  data?: {
    data?: unknown[];
    items?: unknown[];
    summary?: string;
    status?: string;
    summary_text?: string;
    health_score?: number;
    urgent_actions?: string[];
  };
  items?: unknown[];
  responseData?: unknown[];
  summary?: string;
}

export type ProcessingState = {
  isProcessing: boolean;
  content: string;
};

export const WELCOME_MESSAGE = "I'm your Inventory Management Agent. Ask me about stock levels, recent movements, item forecasts, or to record a stock adjustment.";
