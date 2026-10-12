package edu.college.rental.config;

import edu.college.rental.dto.ApiDtos.Message;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class AdminSessionInterceptor implements HandlerInterceptor {
    private final ObjectMapper mapper;
    public AdminSessionInterceptor(ObjectMapper mapper) { this.mapper = mapper; }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if (request.getSession(false) != null && Boolean.TRUE.equals(request.getSession(false).getAttribute("ADMIN_AUTH"))) {
            return true;
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        mapper.writeValue(response.getWriter(), new Message("Sign in as an administrator to continue."));
        return false;
    }
}
