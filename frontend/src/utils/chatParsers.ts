import { ChatResponse, MessageType, ParsedResponse, DebugInfo } from '@/types/chat';

const extractAllJson = (content: string) => {
  const validJsons = [];

  const fencedMatches = content.match(/```json\s*([\s\S\s]*?)\s*```/gi);
  if (fencedMatches) {
    for (const match of fencedMatches) {
      const jsonContent = match.replace(/```json\s*/, '').replace(/```$/, '');
      try {
        const parsed = JSON.parse(jsonContent);
        validJsons.push(parsed);
      } catch (e) {
        console.warn('Fenced JSON parse failed:', jsonContent.substring(0, 100) + '...', e);
      }
    }
  }

  if (validJsons.length === 0) {
    const jsonObjects = extractJsonObjects(content);
    for (const jsonObj of jsonObjects) {
      try {
        const parsed = JSON.parse(jsonObj);
        validJsons.push(parsed);
      } catch (e) {
        console.warn('Object JSON parse failed:', jsonObj.substring(0, 100) + '...', e);
      }
    }
  }

  return validJsons;
};

const extractJsonObjects = (content: string): string[] => {
  const objects = [];
  let braceCount = 0;
  let startIdx = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{' && braceCount === 0) {
        startIdx = i;
      }

      if (char === '{' || char === '}') {
        braceCount += (char === '{') ? 1 : -1;

        if (braceCount === 0 && startIdx !== -1) {
          objects.push(content.substring(startIdx, i + 1));
          startIdx = -1;
        }
      }
    }
  }

  return objects;
};

const mergeJsonFragments = (fragments: any[]) => {
  const merged: any = {};

  for (const fragment of fragments) {
    if (fragment.data?.items && Array.isArray(fragment.data.items)) {
      merged.inventory = fragment.data.items;
      merged.total = fragment.data.total;
    }
    if (fragment.data?.data && Array.isArray(fragment.data.data)) {
      merged.inventory = fragment.data.data;
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

const repairJson = (jsonString: string): string => {
  let repaired = jsonString.trim();

  if (!repaired.endsWith('}')) {
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const missingBraces = openBraces - closeBraces;

    if (missingBraces > 0) {
      repaired += '}'.repeat(missingBraces);
      console.warn(`Added ${missingBraces} closing braces to repair JSON`);
    }
  }

  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  return repaired;
};

const parseFencedJson = (content: string): { parsed: ParsedResponse | null; debugInfo: DebugInfo } => {
  const fencedMatch = content.match(/```json\s*([\s\S\s]*?)\s*```/i);
  if (!fencedMatch || !fencedMatch[1]) {
    return { parsed: null, debugInfo: { source: 'no_fenced_json' } };
  }

  const jsonContent = fencedMatch[1].trim();

  const repairedJson = repairJson(jsonContent);

  if (!isValidJson(repairedJson)) {
    console.warn('Invalid JSON structure detected:', repairedJson.substring(0, 200) + '...');
    return { parsed: null, debugInfo: { source: 'fenced_json_invalid' } };
  }

  try {
    const parsed = JSON.parse(repairedJson);
    const debugInfo: DebugInfo = { source: 'fenced_json', parsed };
    return { parsed, debugInfo };
  } catch (e) {
    console.warn('JSON parsing failed:', e);
    console.warn('JSON content:', repairedJson.substring(0, 500));
    return { parsed: null, debugInfo: { source: 'fenced_json_parse_error', error: e instanceof Error ? e.message : 'Unknown error' } };
  }
};

const isValidJson = (jsonString: string): boolean => {
  if (!jsonString || jsonString.trim() === '') return false;

  const trimmed = jsonString.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false;

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;

      if (braceCount < 0) return false;
    }
  }

  return braceCount === 0;
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

  if (cleanContent.length === 0) {
    return {
      type: 'text',
      content: 'I\'m sorry, I couldn\'t process that request. Could you try rephrasing your question?',
      isProcessing: false,
      debugInfo: finalDebugInfo
    };
  }

  if (cleanContent.toLowerCase().includes('error') ||
      cleanContent.toLowerCase().includes('failed') ||
      cleanContent.toLowerCase().includes('could not')) {
    return {
      type: 'text',
      content: 'I encountered an issue while processing your request. Please try again or contact support if the problem persists.',
      isProcessing: false,
      debugInfo: { ...finalDebugInfo, source: 'error_pattern_detected' }
    };
  }

  return { type: 'text', content: cleanContent, isProcessing: false, debugInfo: finalDebugInfo };
};
