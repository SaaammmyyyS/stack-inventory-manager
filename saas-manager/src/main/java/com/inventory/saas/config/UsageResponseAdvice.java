package com.inventory.saas.config;

import com.inventory.saas.service.BillingGuard;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.util.List;

@ControllerAdvice
public class UsageResponseAdvice implements ResponseBodyAdvice<Object> {

    private final BillingGuard billingGuard;

    public UsageResponseAdvice(BillingGuard billingGuard) {
        this.billingGuard = billingGuard;
    }

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {

        List<String> tenantIds = request.getHeaders().get("X-Tenant-ID");
        List<String> plans = request.getHeaders().get("X-Organization-Plan");

        if (tenantIds != null && !tenantIds.isEmpty()) {
            String tenantId = tenantIds.get(0);
            String plan = (plans != null && !plans.isEmpty()) ? plans.get(0) : "free";

            BillingGuard.UsageStats stats = billingGuard.getUsageStats(tenantId, plan);

            response.getHeaders().add("X-Usage-SKU", stats.currentSkus() + "/" + stats.skuLimit());
            response.getHeaders().add("X-Usage-AI", stats.currentTokens() + "/" + stats.tokenLimit());

            response.getHeaders().add("Access-Control-Expose-Headers", "X-Usage-SKU, X-Usage-AI");
        }

        return body;
    }
}