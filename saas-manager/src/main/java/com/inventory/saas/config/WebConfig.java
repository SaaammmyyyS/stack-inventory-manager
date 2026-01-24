package com.inventory.saas.config;

import org.hibernate.cfg.AvailableSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private TenantInterceptor tenantInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantInterceptor);
    }

    /**
     * We use a low-level approach here to inject the Tenant Resolver
     * without needing the problematic HibernatePropertiesCustomizer interface.
     */
    @Bean
    public Map<String, Object> hibernateVendorProperties(TenantIdentifierResolver tenantResolver) {
        Map<String, Object> props = new HashMap<>();
        props.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, tenantResolver);
        return props;
    }
}