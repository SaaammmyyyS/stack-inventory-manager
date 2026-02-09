package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;

import java.util.Locale;

public class IntentClassifier {

    public Intent classifyBasicIntent(String userMessage) {
        if (userMessage == null) return Intent.OTHER;
        String m = userMessage.toLowerCase(Locale.ROOT);

        if ((m.contains("transaction") || m.contains("transactions") || m.contains("history")) && (m.contains(" for ") || m.contains(" of ") || m.contains(" by "))) {
            return Intent.FILTERED_TRANSACTIONS;
        }

        if (m.contains("stock level") || m.contains("stock levels") || m.contains("stock") || m.contains("inventory") || m.contains("in stock") || m.contains("what do i have")) {
            return Intent.STOCK_SUMMARY;
        }

        if (m.contains("recent") || m.contains("recent movements") || m.contains("movements") || m.contains("activity")) {
            return Intent.RECENT_TRANSACTIONS;
        }

        if (m.contains("low stock") || m.contains("restock") || m.contains("restocking")) {
            return Intent.LOW_STOCK;
        }

        if (m.contains("forecast") || m.contains("runout") || m.contains("run out")) {
            return Intent.FORECAST_QUERIES;
        }

        return Intent.OTHER;
    }
}
