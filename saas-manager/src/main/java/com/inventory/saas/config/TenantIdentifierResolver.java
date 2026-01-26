package com.inventory.saas.config;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import java.util.Map;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String>, org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer {

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContext.getTenantId();
        return (tenantId != null) ? tenantId : "public";
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, this);
    }
}