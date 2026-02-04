package com.inventory.saas.config;

import org.hibernate.cfg.AvailableSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private TenantInterceptor tenantInterceptor;

    @Autowired
    private RateLimitInterceptor rateLimitInterceptor;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate(new JdkClientHttpRequestFactory());
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/webhooks/**");

        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/webhooks/**");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(
                        "http://localhost:5173",
                        "https://*.ap-southeast-1.awsapprunner.com",
                        "https://*-ngrok-free.dev"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .exposedHeaders(
                        "X-Performed-By",
                        "Retry-After",
                        "X-Organization-Plan",
                        "X-Usage-SKU",
                        "X-Usage-AI",
                        "Content-Disposition"
                )
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Bean
    public Map<String, Object> hibernateVendorProperties(org.hibernate.context.spi.CurrentTenantIdentifierResolver tenantResolver) {
        Map<String, Object> props = new HashMap<>();
        props.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, tenantResolver);
        return props;
    }
}