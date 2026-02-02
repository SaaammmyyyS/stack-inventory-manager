package com.inventory.saas.config;

import com.inventory.saas.service.BillingGuard;
import com.inventory.saas.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private BillingGuard billingGuard;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        String tenantId = request.getHeader("X-Tenant-ID");
        String plan = request.getHeader("X-Organization-Plan");

        BillingGuard.PlanLimits limits = billingGuard.getLimits(plan != null ? plan : "free");

        boolean isAllowed = rateLimitService.isAllowed(
                tenantId != null ? tenantId : "anonymous",
                limits.rateLimit()
        );

        if (!isAllowed) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json");

            String jsonResponse = String.format(
                    "{\"error\": \"RATE_LIMIT_EXCEEDED\", \"message\": \"Rate limit exceeded for %s plan. Try again in a minute or upgrade.\", \"limit\": %d}",
                    plan != null ? plan : "free",
                    limits.rateLimit()
            );

            response.getWriter().write(jsonResponse);
            return false;
        }

        return true;
    }
}