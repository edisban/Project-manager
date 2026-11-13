package com.edis.backendproject.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.edis.backendproject.dto.ApiResponse;
import com.edis.backendproject.service.TokenBlacklistService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Stateless JWT security:
 * <ul>
 *   <li>the JWT travels in an HttpOnly, SameSite=Strict cookie (not readable by JavaScript);</li>
 *   <li>CSRF protection uses the double-submit cookie pattern ({@code XSRF-TOKEN} / {@code X-XSRF-TOKEN});</li>
 *   <li>unauthenticated and forbidden requests get JSON 401 / 403 responses.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtTokenProvider tokenProvider,
                                                   AuthCookieService authCookieService,
                                                   AuthProperties authProperties,
                                                   TokenBlacklistService tokenBlacklistService,
                                                   UserDetailsService userDetailsService,
                                                   CorsConfigurationSource corsConfigurationSource,
                                                   @Value("${app.cors.allowed-origins:}") String allowedOrigins,
                                                   ObjectMapper objectMapper) throws Exception {

        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookieCustomizer(cookie -> cookie
                .path("/")
                .sameSite("Strict")
                .secure(authProperties.cookieSecure()));

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(
                tokenProvider, authCookieService, tokenBlacklistService, userDetailsService);

        // The SPA is normally served from the same origin as the API (nginx / Vite proxy), so CORS is only
        // enabled when cross-origin frontends are explicitly configured. Behind a proxy on a non-default
        // port the server cannot reliably tell that a request is same-origin, which made CORS reject it.
        if (StringUtils.hasText(allowedOrigins)) {
            http.cors(cors -> cors.configurationSource(corsConfigurationSource));
        } else {
            http.cors(AbstractHttpConfigurer::disable);
        }

        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, ex) ->
                    writeError(response, objectMapper, HttpStatus.UNAUTHORIZED, "Authentication required"))
                .accessDeniedHandler((request, response, ex) ->
                    writeError(response, objectMapper, HttpStatus.FORBIDDEN,
                        ex instanceof CsrfException ? "Invalid or missing CSRF token" : "Access denied")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register", "/api/auth/logout").permitAll()
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:}") String allowedOriginsProperty) {
        List<String> origins = Arrays.stream(allowedOriginsProperty.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * Argon2id with the OWASP-recommended minimum: 19 MiB memory, 2 iterations, 1 thread
     * (16-byte salt, 32-byte hash). Parameters are stored in each hash, so they can be raised later.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(16, 32, 1, 19 * 1024, 2);
    }

    private static void writeError(HttpServletResponse response, ObjectMapper objectMapper,
                                   HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(message));
    }
}
