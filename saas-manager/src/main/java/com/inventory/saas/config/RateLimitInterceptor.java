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
        String plan = request.getHeader("X-Tenant-Plan");

        BillingGuard.PlanLimits limits = billingGuard.getLimits(plan);

        boolean isAllowed = rateLimitService.isAllowed(
                tenantId != null ? tenantId : "anon",
                limits.rateLimit(),
                60
        );

        if (!isAllowed) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\": \"Rate limit exceeded for " + (plan != null ? plan : "Free") + " plan.\"}");
            return false;
        }

        return true;
    }
}