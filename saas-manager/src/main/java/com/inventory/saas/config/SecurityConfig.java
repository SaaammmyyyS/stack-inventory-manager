package com.inventory.saas.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/inventory/trash").hasAnyRole("ADMIN", "MEMBER")
                        .requestMatchers(HttpMethod.PUT, "/api/inventory/restore/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/inventory/permanent/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/inventory/**").hasAnyRole("ADMIN", "MEMBER", "USER")
                        .requestMatchers(HttpMethod.POST, "/api/inventory/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/inventory/**").hasRole("ADMIN")

                        .requestMatchers("/api/transactions/**").authenticated()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
                        jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())
                ));

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new ArrayList<>();
            String rawRole = null;

            Map<String, Object> orgs = jwt.getClaim("o");
            if (orgs != null && !orgs.isEmpty()) {
                for (Object orgData : orgs.values()) {
                    if (orgData instanceof Map) {
                        Map<?, ?> details = (Map<?, ?>) orgData;
                        Object roleObj = details.get("role");
                        if (roleObj != null) {
                            rawRole = roleObj.toString();
                            break;
                        }
                    }
                }
            }

            if (rawRole == null || rawRole.contains("{{")) {
                Map<String, Object> metadata = jwt.getClaim("public_metadata");
                if (metadata == null) metadata = jwt.getClaim("metadata");
                if (metadata != null && metadata.get("role") != null) {
                    rawRole = metadata.get("role").toString();
                }
            }

            if (rawRole != null && !rawRole.contains("{{")) {
                String cleanRole = rawRole.contains(":") ? rawRole.split(":")[1].toUpperCase() : rawRole.toUpperCase();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + cleanRole));

                if (cleanRole.equals("ADMIN")) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_MEMBER"));
                }
            } else {
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
            }

            System.out.println("Final Authorities for user: " + authorities);
            return authorities;
        });
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "https://dmtc2sumyu.ap-southeast-1.awsapprunner.com"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Tenant-ID", "X-Performed-By", "Cache-Control"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}