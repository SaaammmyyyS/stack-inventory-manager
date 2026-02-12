package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PatternDebugTest {

    @Test
    void debugPatternMatching() {
        PhrasePatternMatcher matcher = new PhrasePatternMatcher();

        PhrasePatternMatcher.PatternMatchResult result = matcher.matchPattern("what do I have inventory");

        System.out.println("Input: 'what do I have inventory'");
        System.out.println("Expected: STOCK_SUMMARY");
        System.out.println("Actual: " + result.intent());
        System.out.println("Confidence: " + result.confidence());
        System.out.println("Matched text: " + result.matchedText());

        PhrasePatternMatcher.PatternMatchResult result2 = matcher.matchPattern("show me stock levels");
        System.out.println("\nInput: 'show me stock levels'");
        System.out.println("Expected: STOCK_SUMMARY");
        System.out.println("Actual: " + result2.intent());
        System.out.println("Confidence: " + result2.confidence());
        System.out.println("Matched text: " + result2.matchedText());
    }
}
