package com.inventory.saas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;

@Service
public class RateLimitService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    public boolean isAllowed(String tenantId, int limit, int windowSeconds) {
        String key = "rl:" + tenantId;
        try {
            Long currentCount = redisTemplate.opsForValue().increment(key);

            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(key, windowSeconds, TimeUnit.SECONDS);
            }

            return currentCount != null && currentCount <= limit;
        } catch (Exception e) {
            System.err.println("RateLimit Error (Redis): " + e.getMessage());
            return true;
        }
    }
}