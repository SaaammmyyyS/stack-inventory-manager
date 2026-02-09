package com.inventory.saas.service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

class PerformerMatcher {

    String matchPerformer(String filter, List<String> distinctPerformers) {
        if (filter == null) return null;
        String f = filter.trim().toLowerCase(Locale.ROOT);
        if (f.isBlank() || distinctPerformers == null || distinctPerformers.isEmpty()) return null;

        List<String> candidates = distinctPerformers.stream()
                .filter(s -> s != null && !s.trim().isBlank())
                .collect(Collectors.toList());
        if (candidates.isEmpty()) return null;

        record Scored(String value, int score) {}

        List<Scored> scored = candidates.stream()
                .map(v -> new Scored(v, scorePerformerMatch(f, v)))
                .filter(s -> s.score() > 0)
                .sorted(Comparator.<Scored>comparingInt(Scored::score).reversed()
                        .thenComparing((Scored s) -> s.value() != null ? s.value().length() : 0, Comparator.reverseOrder()))
                .collect(Collectors.toList());

        if (scored.isEmpty()) return null;

        Scored best = scored.get(0);
        if (scored.size() > 1) {
            Scored second = scored.get(1);
            if (best.score() > 0 && second.score() > 0 && Math.abs(best.score() - second.score()) <= 10 && f.length() <= 4) {
                return null;
            }
        }

        return best.value();
    }

    private int scorePerformerMatch(String filterLower, String performer) {
        if (performer == null) return 0;
        String p = performer.trim().toLowerCase(Locale.ROOT);
        if (p.isBlank()) return 0;

        if (p.equals(filterLower)) return 2000;
        if (p.startsWith(filterLower)) return 1500 + Math.min(filterLower.length(), 50);
        if (filterLower.startsWith(p)) return 1400 + Math.min(p.length(), 50);
        if (p.contains(filterLower)) return 1200 + Math.min(filterLower.length(), 50);

        List<String> pTokens = Arrays.stream(p.split("\\s+"))
                .filter(t -> !t.isBlank())
                .collect(Collectors.toList());
        if (pTokens.stream().anyMatch(t -> t.equals(filterLower))) {
            return 1100 + Math.min(filterLower.length(), 50);
        }

        int prefix = commonPrefixLength(filterLower, p);
        if (prefix >= 3) return 900 + prefix;

        return 0;
    }

    private int commonPrefixLength(String a, String b) {
        int max = Math.min(a.length(), b.length());
        int i = 0;
        for (; i < max; i++) {
            if (a.charAt(i) != b.charAt(i)) break;
        }
        return i;
    }
}
