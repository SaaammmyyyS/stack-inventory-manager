package com.inventory.saas.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.function.Supplier;

@Service
public class RateLimitService {

    private LettuceBasedProxyManager<byte[]> proxyManager;
    private RedisClient redisClient;

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Value("${spring.data.redis.password}")
    private String redisPassword;

    @PostConstruct
    public void init() {
        RedisURI uri = RedisURI.builder()
                .withHost(redisHost)
                .withPort(redisPort)
                .withPassword(redisPassword.toCharArray())
                .withSsl(true)
                .build();

        this.redisClient = RedisClient.create(uri);

        this.proxyManager = LettuceBasedProxyManager.builderFor(redisClient)
                .withExpirationStrategy(ExpirationAfterWriteStrategy.fixedTimeToLive(Duration.ofHours(1)))
                .build();
    }

    public boolean isAllowed(String tenantId, int limitPerMinute) {
        String key = "rl_bucket:" + tenantId;

        Supplier<BucketConfiguration> configSupplier = () -> BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limitPerMinute)
                        .refillIntervally(limitPerMinute, Duration.ofMinutes(1))
                        .build())
                .build();

        return proxyManager.builder().build(key.getBytes(), configSupplier).tryConsume(1);
    }
}