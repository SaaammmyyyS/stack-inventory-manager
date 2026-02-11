package com.inventory.saas;

import com.inventory.saas.service.AiForecastService;
import com.inventory.saas.service.BillingGuard;
import com.inventory.saas.service.RateLimitService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.mockito.Mockito;

@Configuration
@TestConfiguration
public class TestConfig {

    @MockBean
    private RateLimitService rateLimitService;

    @MockBean
    private AiForecastService aiForecastService;

    @MockBean
    private BillingGuard billingGuard;

    @MockBean
    private StringRedisTemplate redisTemplate;

    @Bean
    @Primary
    public ChatClient mockChatClient() {
        ChatClient mockClient = Mockito.mock(ChatClient.class);
        return mockClient;
    }

    @Bean("simpleChatClient")
    public ChatClient simpleChatClient() {
        return Mockito.mock(ChatClient.class);
    }
}
