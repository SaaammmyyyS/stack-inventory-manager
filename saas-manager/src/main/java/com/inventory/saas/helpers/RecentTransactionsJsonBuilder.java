package com.inventory.saas.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.saas.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RecentTransactionsJsonBuilder {

    private static final Logger logger = LoggerFactory.getLogger(RecentTransactionsJsonBuilder.class);

    private final TransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;
    private final PerformerMatcher performerMatcher;

    public RecentTransactionsJsonBuilder(TransactionRepository transactionRepository, ObjectMapper objectMapper) {
        this.transactionRepository = transactionRepository;
        this.objectMapper = objectMapper;
        this.performerMatcher = new PerformerMatcher();
    }

    String buildRecentTransactionsJsonFilteredByItemName(String tenantId, String itemNameFilter) throws Exception {
        List<Map<String, Object>> raw = transactionRepository.findRecentTransactionsRaw(tenantId);
        String filter = itemNameFilter != null ? itemNameFilter.trim().toLowerCase(Locale.ROOT) : "";

        List<Map<String, Object>> data = raw.stream()
                .filter(row -> row != null)
                .filter(row -> {
                    if (filter.isEmpty()) return true;
                    Object itemName = row.get("itemName");
                    return itemName != null && itemName.toString().toLowerCase(Locale.ROOT).contains(filter);
                })
                .map(row -> {
                    Map<String, Object> m = new HashMap<>();
                    Object id = row.get("id");
                    Object itemName = row.get("itemName");
                    Object type = row.get("type");
                    Object qtyChange = row.get("quantityChange");
                    Object reason = row.get("reason");
                    Object performedBy = row.get("performedBy");
                    Object createdAt = row.get("createdAt");

                    m.put("id", id != null ? id.toString() : null);
                    m.put("itemName", itemName);
                    m.put("type", type);

                    int qc = 0;
                    if (qtyChange instanceof Number n) {
                        qc = n.intValue();
                    }
                    m.put("quantityChange", qc);
                    m.put("amount", Math.abs(qc));

                    m.put("reason", reason);
                    m.put("performedBy", performedBy);
                    m.put("createdAt", createdAt != null ? createdAt.toString() : null);
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        if (!filter.isEmpty()) {
            result.put("summary", data.isEmpty() ? "No transactions found for '" + itemNameFilter + "'." : "Transactions for '" + itemNameFilter + "':");
        } else {
            result.put("summary", data.isEmpty() ? "No recent transactions found." : "Here are the recent stock movements:");
        }
        result.put("data", data);
        result.put("total", data.size());

        return objectMapper.writeValueAsString(result);
    }

    String buildRecentTransactionsJsonFilteredByPerformedBy(String tenantId, String performedByFilter) throws Exception {
        List<Map<String, Object>> raw = transactionRepository.findRecentTransactionsRaw(tenantId);
        String filter = performedByFilter != null ? performedByFilter.trim().toLowerCase(Locale.ROOT) : "";

        logger.info("performedBy filter requested tenant={} filterValue='{}' rawRows={}", tenantId, performedByFilter, raw != null ? raw.size() : 0);

        List<Map<String, Object>> data = filterRecentTransactionsByPerformedByRaw(raw, filter);

        if (!filter.isEmpty() && data.isEmpty()) {
            List<String> distinctPerformers = transactionRepository.findDistinctPerformedBy(tenantId);
            String matched = performerMatcher.matchPerformer(filter, distinctPerformers);
            if (matched != null && !matched.trim().isBlank()) {
                String matchedFilter = matched.trim().toLowerCase(Locale.ROOT);
                if (!matchedFilter.equals(filter)) {
                    logger.info("performedBy fuzzy match tenant={} input='{}' matched='{}'", tenantId, performedByFilter, matched);
                    data = filterRecentTransactionsByPerformedByRaw(raw, matchedFilter);
                    performedByFilter = matched;
                    filter = matchedFilter;
                }
            }
        }

        logger.info("performedBy filter applied tenant={} effectiveFilter='{}' resultRows={}", tenantId, filter, data.size());

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        if (!filter.isEmpty()) {
            result.put("summary", data.isEmpty() ? "No transactions found performed by '" + performedByFilter + "'." : "Transactions performed by '" + performedByFilter + "':");
        } else {
            result.put("summary", data.isEmpty() ? "No recent transactions found." : "Here are the recent stock movements:");
        }
        result.put("data", data);
        result.put("total", data.size());

        return objectMapper.writeValueAsString(result);
    }

    private List<Map<String, Object>> filterRecentTransactionsByPerformedByRaw(List<Map<String, Object>> raw, String filter) {
        if (raw == null) return List.of();

        return raw.stream()
                .filter(row -> row != null)
                .filter(row -> {
                    if (filter == null || filter.isBlank()) return true;
                    Object performedBy = row.get("performedBy");
                    return performedBy != null && performedBy.toString().toLowerCase(Locale.ROOT).contains(filter);
                })
                .map(row -> {
                    Map<String, Object> m = new HashMap<>();
                    Object id = row.get("id");
                    Object itemName = row.get("itemName");
                    Object type = row.get("type");
                    Object qtyChange = row.get("quantityChange");
                    Object reason = row.get("reason");
                    Object performedBy = row.get("performedBy");
                    Object createdAt = row.get("createdAt");

                    m.put("id", id != null ? id.toString() : null);
                    m.put("itemName", itemName);
                    m.put("type", type);

                    int qc = 0;
                    if (qtyChange instanceof Number n) {
                        qc = n.intValue();
                    }
                    m.put("quantityChange", qc);
                    m.put("amount", Math.abs(qc));

                    m.put("reason", reason);
                    m.put("performedBy", performedBy);
                    m.put("createdAt", createdAt != null ? createdAt.toString() : null);
                    return m;
                })
                .collect(Collectors.toList());
    }
}
