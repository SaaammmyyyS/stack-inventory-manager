package com.inventory.saas;

import com.inventory.saas.service.AiForecastService;
import com.inventory.saas.service.BillingGuard;
import com.inventory.saas.service.RateLimitService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.PropertySource;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.mockito.Mockito;

@Configuration
@TestConfiguration
@PropertySource("classpath:application-test.properties")
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

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Provide fallback values for environment variables that might be missing
        // These are used when tests run outside IntelliJ IDEA without .env file

        // Database fallback (H2 is already configured in application-test.properties)
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
        registry.add("spring.datasource.username", () -> "sa");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");

        // Security fallback for tests
        registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri", () -> "http://localhost:9999");
        registry.add("CLERK_SECRET_KEY", () -> "dummy-clerk-secret-key-for-test");

        // Redis fallback for tests (will be mocked anyway)
        registry.add("spring.data.redis.host", () -> "localhost");
        registry.add("spring.data.redis.port", () -> "6379");
        registry.add("spring.data.redis.password", () -> "");
        registry.add("spring.data.redis.ssl.enabled", () -> "false");

        // AI configuration - ensure disabled for tests
        registry.add("spring.ai.bedrock.converse.chat.enabled", () -> "false");
        registry.add("spring.ai.ollama.chat.enabled", () -> "false");

        // Database platform for H2
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.H2Dialect");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.show-sql", () -> "true");
    }
}
