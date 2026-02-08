package com.inventory.saas;

import com.inventory.saas.service.AiForecastService;
import com.inventory.saas.service.BillingGuard;
import com.inventory.saas.service.RateLimitService;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Configuration;

/**
 * Test configuration so CI does not require Redis or AI (Bedrock/Ollama).
 * - RateLimitService connects to Redis in @PostConstruct; mock replaces it.
 * - AiForecastService requires a ChatModel (Bedrock/Ollama); mock replaces it.
 * - BillingGuard uses StringRedisTemplate (Redis); mock replaces it to avoid connection.
 */
@Configuration
public class TestConfig {

    @MockBean
    private RateLimitService rateLimitService;

    @MockBean
    private AiForecastService aiForecastService;

    @MockBean
    private BillingGuard billingGuard;
}
