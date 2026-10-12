package edu.college.rental.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final AdminSessionInterceptor auth;
    private final String frontendOrigin;
    public WebConfig(AdminSessionInterceptor auth, @Value("${app.frontend.origin}") String frontendOrigin) {
        this.auth = auth; this.frontendOrigin = frontendOrigin;
    }
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auth).addPathPatterns("/api/**")
            .excludePathPatterns("/api/healthz", "/api/auth/**", "/api/account/**", "/api/vehicles/available");
    }
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOriginPatterns(frontendOrigin, "http://localhost:*", "https://*.replit.dev", "https://*.onrender.com", "https://*.netlify.app")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*").allowCredentials(true).maxAge(3600);
    }
}
