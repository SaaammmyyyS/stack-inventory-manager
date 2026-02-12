package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

@Component
public class PhrasePatternMatcher {

    private final List<IntentPattern> intentPatterns = new ArrayList<>();

    public PhrasePatternMatcher() {
        initializePatterns();
    }

    private void initializePatterns() {
        addPattern(Intent.STOCK_SUMMARY,
            Pattern.compile("(?i)(what|show|tell|give|list|display|get|check|see)\\s+(do\\s+I\\s+have|is\\s+my|are\\s+my|current|present|existing)\\s+(inventory|stock|items|products|goods|supplies|materials|resources|assets|catalog)"),
            0.9);

        addPattern(Intent.STOCK_SUMMARY,
            Pattern.compile("(?i)(how\\s+many|what|which)\\s+(items|products|goods|things)\\s+(do\\s+I\\s+have|are\\s+available|are\\s+in\\s+stock|do\\s+we\\s+have)"),
            0.9);

        addPattern(Intent.STOCK_SUMMARY,
            Pattern.compile("(?i)(current|present|existing|total|overall)\\s+(inventory|stock|items|products)\\s+(status|levels|count|quantity)"),
            0.9);

        addPattern(Intent.STOCK_SUMMARY,
            Pattern.compile("(?i)(show|tell|give|list|display|get|check|see)\\s+(me\\s+)?(my|your|our)?\\s+(products|goods|items|inventory|stock)"),
            0.9);

        addPattern(Intent.STOCK_SUMMARY,
            Pattern.compile("(?i)(inventory|stock)\\s+(overview|summary|status|report|check)"),
            0.8);

        addPattern(Intent.STOCK_SUMMARY,
            Pattern.compile("(?i)(stock|inventory)\\s+(level|levels)"),
            0.9);

        addPattern(Intent.STOCK_SUMMARY,
            Pattern.compile("(?i)^(stock|inventory)\\s*(level|levels)?\\s*$"),
            0.95);

        addPattern(Intent.FILTERED_TRANSACTIONS,
            Pattern.compile("(?i)(show|tell|give|list|display|get|check|see)\\s+(me\\s+)?(transactions|movements|changes|updates|activity|history|records|logs)\\s+(by|for|of|from|related\\s+to)\\s+([^\\s]+)"),
            0.95);

        addPattern(Intent.FILTERED_TRANSACTIONS,
            Pattern.compile("(?i)(transactions|movements|changes|updates|activity|history|records|logs)\\s+(by|for|of|from|related\\s+to)\\s+([^\\s]+)"),
            0.95);

        addPattern(Intent.FILTERED_TRANSACTIONS,
            Pattern.compile("(?i)(filter|show|list)\\s+(transactions|movements|changes|updates|activity)\\s+(by|for|of)\\s+([^\\s]+)"),
            0.95);

        addPattern(Intent.RECENT_TRANSACTIONS,
            Pattern.compile("(?i)(show|tell|give|list|display|get|check|see)\\s+(me\\s+)?(recent|latest|new|current)?\\s*(transactions|movements|changes|updates|activity|history|records|logs)"),
            0.9);

        addPattern(Intent.RECENT_TRANSACTIONS,
            Pattern.compile("(?i)(what\\s+has|what\\s+have|what's\\s+been)\\s+(happening|going\\s+on|occurring|changing)\\s+(with|in|to)\\s+(my|the)?\\s*(inventory|stock)?\\s*(movements|changes|activity|history|transactions)?"),
            0.9);

        addPattern(Intent.RECENT_TRANSACTIONS,
            Pattern.compile("(?i)(recent|latest|new)?\\s*(stock\\s+movements|changes|activity|history|transactions)"),
            0.9);

        addPattern(Intent.RECENT_TRANSACTIONS,
            Pattern.compile("(?i)(transaction|movement|activity)\\s+(history|log|record)"),
            0.8);

        addPattern(Intent.RECENT_TRANSACTIONS,
            Pattern.compile("(?i)^(transactions?|movements?|activity|history|logs?|records?)\\s*$"),
            0.95);

        addPattern(Intent.RECENT_TRANSACTIONS,
            Pattern.compile("(?i)^(show|tell|give|list|display|get|check|see)\\s+(me\\s+)?(transactions?|movements?|activity|history|logs?|records?)\\s*$"),
            0.95);

        addPattern(Intent.LOW_STOCK,
            Pattern.compile("(?i)(show|tell|give|list|display|get|check|see|identify|find)\\s+(me\\s+)?(items|products|things)\\s+(that|which)\\s+(need|require)\\s+(restocking|reordering|to\\s+be\\s+ordered)"),
            0.9);

        addPattern(Intent.LOW_STOCK,
            Pattern.compile("(?i)(what|which)\\s+(items|products|things)\\s+(are|is)\\s+(running\\s+low|low\\s+in\\s+stock|out\\s+of\\s+stock|depleted|scarce|insufficient)"),
            0.9);

        addPattern(Intent.LOW_STOCK,
            Pattern.compile("(?i)(low|reorder|restock)\\s+(stock|inventory|items|products|levels)"),
            0.8);

        addPattern(Intent.LOW_STOCK,
            Pattern.compile("(?i)(items|products)\\s+(to\\s+)?(reorder|restock|order|restock)"),
            0.8);

        addPattern(Intent.LOW_STOCK,
            Pattern.compile("(?i)(low\\s+stock|restock|reorder|restocking|running\\s+low|depleted|scarce|insufficient|out\\s+of\\s+stock|need\\s+to\\s+order|time\\s+to\\s+restock|stock\\s+alert|critical)"),
            0.9);

        addPattern(Intent.FORECAST_QUERIES,
            Pattern.compile("(?i)(show|tell|give|list|display|get|check|see|calculate|predict)\\s+(me\\s+)?(forecast|prediction|projection|estimate|outlook)"),
            0.9);

        addPattern(Intent.FORECAST_QUERIES,
            Pattern.compile("(?i)(when\\s+will|when\\s+do|predict\\s+when|estimate\\s+when)\\s+(I|we)\\s+(run\\s+out|need\\s+to\\s+order|should\\s+reorder)"),
            0.9);

        addPattern(Intent.FORECAST_QUERIES,
            Pattern.compile("(?i)(how\\s+many|how\\s+much)\\s+(days|time|long)\\s+(until|before|remaining)\\s+(run\\s+out|depletion|empty)"),
            0.9);

        addPattern(Intent.FORECAST_QUERIES,
            Pattern.compile("(?i)(future|upcoming|predicted)\\s+(stock|inventory)\\s+(needs|requirements|levels)"),
            0.8);

        addPattern(Intent.FORECAST_QUERIES,
            Pattern.compile("(?i)(run\\s+out|depletion|reorder)\\s+(date|time|schedule|timeline)"),
            0.8);
    }

    private void addPattern(Intent intent, Pattern pattern, double confidence) {
        intentPatterns.add(new IntentPattern(intent, pattern, confidence));
    }

    public PatternMatchResult matchPattern(String message) {
        if (message == null || message.trim().isEmpty()) {
            return new PatternMatchResult(Intent.OTHER, 0.0, null, "Empty message");
        }

        Intent bestMatch = Intent.OTHER;
        double bestConfidence = 0.0;
        String matchedText = null;
        String explanation = "No pattern matched";

        for (IntentPattern intentPattern : intentPatterns) {
            Matcher matcher = intentPattern.pattern().matcher(message);

            if (matcher.find()) {
                double confidence = intentPattern.confidence();

                if (matcher.groupCount() > 0) {
                    confidence += 0.1;
                }

                if (confidence > bestConfidence) {
                    bestMatch = intentPattern.intent();
                    bestConfidence = confidence;
                    matchedText = matcher.group();
                    explanation = String.format("Matched pattern: %s", intentPattern.pattern().pattern());
                }
            }
        }

        return new PatternMatchResult(bestMatch, bestConfidence, matchedText, explanation);
    }

    public List<PatternMatchResult> getAllMatches(String message) {
        List<PatternMatchResult> matches = new ArrayList<>();

        if (message == null || message.trim().isEmpty()) {
            return matches;
        }

        for (IntentPattern intentPattern : intentPatterns) {
            Matcher matcher = intentPattern.pattern().matcher(message);

            if (matcher.find()) {
                double confidence = intentPattern.confidence();
                if (matcher.groupCount() > 0) {
                    confidence += 0.1;
                }

                matches.add(new PatternMatchResult(
                    intentPattern.intent(),
                    confidence,
                    matcher.group(),
                    String.format("Pattern: %s", intentPattern.pattern().pattern())
                ));
            }
        }

        return matches;
    }

    public boolean matchesIntent(String message, Intent intent) {
        for (IntentPattern intentPattern : intentPatterns) {
            if (intentPattern.intent() == intent) {
                Matcher matcher = intentPattern.pattern().matcher(message);
                if (matcher.find()) {
                    return true;
                }
            }
        }
        return false;
    }

    private record IntentPattern(
        Intent intent,
        Pattern pattern,
        double confidence
    ) {}

    public record PatternMatchResult(
        Intent intent,
        double confidence,
        String matchedText,
        String explanation
    ) {
        public boolean isHighConfidence() {
            return confidence >= 0.8;
        }

        public boolean isMediumConfidence() {
            return confidence >= 0.6 && confidence < 0.8;
        }
    }
}
