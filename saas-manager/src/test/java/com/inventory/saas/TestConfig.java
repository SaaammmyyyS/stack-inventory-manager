package com.inventory.saas;

import com.inventory.saas.service.AiForecastService;
import com.inventory.saas.service.BillingGuard;
import com.inventory.saas.service.RateLimitService;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TestConfig {

    @MockBean
    private RateLimitService rateLimitService;

    @MockBean
    private AiForecastService aiForecastService;

    @MockBean
    private BillingGuard billingGuard;
}
