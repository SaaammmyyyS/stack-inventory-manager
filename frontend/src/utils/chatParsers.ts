import { ChatResponse, MessageType, ParsedResponse, DebugInfo } from '@/types/chat';

const extractAllJson = (content: string) => {
  const jsonMatches = content.match(/\{[^}]*\}/g) || [];
  const validJsons = [];

  for (const match of jsonMatches) {
    try {
      let fixed = match;
      fixed = fixed.replace(/([{,])([^"])/g, '$1"$2');
      fixed = fixed.replace(/([{,])([^"])/g, '$1"$2');
      fixed = fixed.replace(/,([}\]])/g, '$1');

      const parsed = JSON.parse(fixed);
      validJsons.push(parsed);
    } catch (e) {
      console.warn('JSON parse failed:', match, e);
    }
  }

  return validJsons;
};

const mergeJsonFragments = (fragments: any[]) => {
  const merged: any = {};

  for (const fragment of fragments) {
    if (fragment.data && Array.isArray(fragment.data)) {
      merged.inventory = fragment.data;
    }
    if (fragment.status) merged.status = fragment.status;
    if (fragment.summary_text || fragment.summary) merged.summary = fragment.summary_text || fragment.summary;
    if (fragment.health_score !== undefined) merged.health_score = fragment.health_score;
    if (fragment.urgent_actions) merged.urgent_actions = fragment.urgent_actions;
  }

  return merged;
};

const isConversationalMessage = (content: string): boolean => {
  if (content.includes('```') || content.includes('{') || content.includes('debug')) {
    return false;
  }

  const lowerContent = content.toLowerCase();
  const conversationalKeywords = ['hello', 'hi', 'thank', 'goodbye', 'help', 'assist'];
  return conversationalKeywords.some(keyword => lowerContent.includes(keyword));
};

const isProcessingMessage = (content: string): boolean => {
  const processingKeywords = ['please wait', 'processing', 'fetching', 'analyzing', 'once data is ready'];
  return processingKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );
};

const parseFencedJson = (content: string): { parsed: ParsedResponse | null; debugInfo: DebugInfo } => {
  const fencedMatch = content.match(/```json\s*([\s\S\s]*?)\s*```/i);
  if (!fencedMatch || !fencedMatch[1]) {
    return { parsed: null, debugInfo: { source: 'no_fenced_json' } };
  }

  try {
    const parsed = JSON.parse(fencedMatch[1]);
    const debugInfo: DebugInfo = { source: 'fenced_json', parsed };
    return { parsed, debugInfo };
  } catch (e) {
    console.warn('JSON parsing failed:', e);
    return { parsed: null, debugInfo: { source: 'fenced_json_parse_error' } };
  }
};

const handleIntentBasedResponse = (parsed: ParsedResponse, debugInfo: DebugInfo): ChatResponse | null => {
  if (!parsed?.debug?.intent || !parsed?.data) {
    return null;
  }

  const intent = parsed.debug.intent;
  const enhancedDebugInfo = {
    ...debugInfo,
    intent: intent,
    entities: parsed.debug.entities,
    data: parsed.data
  };

  switch (intent) {
    case 'FORECAST_QUERIES':
      return handleForecastQueries(parsed.data, enhancedDebugInfo);

    case 'INVENTORY_QUERIES':
      return handleInventoryQueries(parsed.data, enhancedDebugInfo);

    case 'LOW_STOCK':
      return handleLowStock(parsed.data, enhancedDebugInfo);

    case 'RECENT_TRANSACTIONS':
    case 'FILTERED_TRANSACTIONS':
      return handleTransactions(parsed.data, enhancedDebugInfo);

    default:
      return null;
  }
};

const handleForecastQueries = (data: any, debugInfo: DebugInfo): ChatResponse | null => {
  if (data?.data && Array.isArray(data.data)) {
    const forecastData = data.data;

    if (forecastData.length > 0 && (forecastData[0]?.itemName || forecastData[0]?.daysRemaining !== undefined || forecastData[0]?.healthStatus)) {
      return {
        type: 'forecast',
        content: data.summary || 'Inventory forecasts:',
        data: forecastData,
        isProcessing: false,
        debugInfo,
      };
    }
  }

  if (data?.items && Array.isArray(data.items)) {
    return {
      type: 'forecast',
      content: data.summary || 'Inventory forecasts:',
      data: data.items,
      isProcessing: false,
      debugInfo,
    };
  }

  return null;
};

const handleInventoryQueries = (data: any, debugInfo: DebugInfo): ChatResponse | null => {
  if (data?.data && Array.isArray(data.data)) {
    return {
      type: 'inventory',
      content: data.summary || 'Current inventory status:',
      data: data.data,
      isProcessing: false,
      debugInfo,
    };
  }

  if (data?.items && Array.isArray(data.items)) {
    return {
      type: 'inventory',
      content: data.summary || 'Current inventory status:',
      data: data.items,
      isProcessing: false,
      debugInfo,
    };
  }

  return null;
};

const handleLowStock = (data: any, debugInfo: DebugInfo): ChatResponse | null => {
  if (data?.items && Array.isArray(data.items)) {
    return {
      type: 'inventory',
      content: data.summary || 'Low stock items:',
      data: data.items,
      isProcessing: false,
      debugInfo,
    };
  }

  if (data?.data && Array.isArray(data.data)) {
    return {
      type: 'inventory',
      content: data.summary || 'Low stock items:',
      data: data.data,
      isProcessing: false,
      debugInfo,
    };
  }

  return null;
};

const handleTransactions = (data: any, debugInfo: DebugInfo): ChatResponse | null => {
  if (data?.data && Array.isArray(data.data)) {
    return {
      type: 'transactions',
      content: data.summary || 'Here are the recent stock movements:',
      data: data.data,
      isProcessing: false,
      debugInfo,
    };
  }

  return null;
};

const handleFallbackParsing = (parsed: ParsedResponse, debugInfo: DebugInfo): ChatResponse | null => {
  if (parsed?.responseData && Array.isArray(parsed.responseData)) {
    return {
      type: 'transactions',
      content: parsed.summary || 'Here are the recent stock movements:',
      data: parsed.responseData,
      isProcessing: false,
      debugInfo,
    };
  }

  if (parsed?.items && Array.isArray(parsed.items)) {
    return {
      type: 'inventory',
      content: parsed.summary || 'Current inventory status:',
      data: parsed.items,
      isProcessing: false,
      debugInfo,
    };
  }

  if (typeof parsed?.summary === 'string') {
    return { type: 'text', content: parsed.summary, isProcessing: false, debugInfo };
  }

  return null;
};

export const formatChatResponse = (content: string): ChatResponse => {
  if (!content) return { type: 'text', content: 'No response available.' };

  if (isConversationalMessage(content)) {
    return {
      type: 'conversational',
      content: content,
      isProcessing: false,
      debugInfo: { source: 'conversational_detection' }
    };
  }

  if (isProcessingMessage(content)) {
    return {
      type: 'processing',
      content: content,
      isProcessing: true,
      debugInfo: { source: 'processing_detection' }
    };
  }

  const { parsed, debugInfo } = parseFencedJson(content);
  if (parsed) {
    const intentResponse = handleIntentBasedResponse(parsed, debugInfo);
    if (intentResponse) {
      return intentResponse;
    }

    const fallbackResponse = handleFallbackParsing(parsed, debugInfo);
    if (fallbackResponse) {
      return fallbackResponse;
    }

    if (typeof parsed.data?.summary === 'string') {
      return { type: 'text', content: parsed.data.summary, isProcessing: false, debugInfo };
    }
  }

  const jsonFragments = extractAllJson(content);
  let parsedData: any = null;
  let fragmentDebugInfo: DebugInfo | null = null;

  if (jsonFragments.length > 0) {
    parsedData = mergeJsonFragments(jsonFragments);
    fragmentDebugInfo = { source: 'json_fragments', fragments: jsonFragments, merged: parsedData };
  }

  if (parsedData) {
    if (parsedData.inventory && Array.isArray(parsedData.inventory)) {
      const transactions = parsedData.inventory;
      if (transactions.length > 0 && (transactions[0].type || transactions[0].amount !== undefined)) {
        return {
          type: 'transactions',
          content: 'Here are the recent stock movements:',
          data: transactions,
          isProcessing: false,
          debugInfo: fragmentDebugInfo
        };
      }
      if (transactions.length > 0 && (transactions[0].name || transactions[0].quantity !== undefined)) {
        return {
          type: 'inventory',
          content: parsedData.summary || 'Current inventory status:',
          data: transactions,
          isProcessing: false,
          debugInfo: fragmentDebugInfo
        };
      }
    }
  }

  let cleanContent = content
    .replace(/```json[\s\S\s]*?```/g, '')
    .replace(/```[\s\S\s]*?```/g, '')
    .replace(/\{[\s\S\s]*\}/g, '')
    .replace(/^\s*[\r\n]/gm, '')
    .trim();

  if (parsedData && parsedData.summary) {
    cleanContent = parsedData.summary;
  }

  const finalDebugInfo = fragmentDebugInfo || debugInfo || {
    source: 'fallback',
    message: 'No structured data found',
    originalContent: content.substring(0, 200) + (content.length > 200 ? '...' : '')
  };

  return { type: 'text', content: cleanContent, isProcessing: false, debugInfo: finalDebugInfo };
};
