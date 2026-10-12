package edu.college.rental.controller;

import edu.college.rental.dto.ApiDtos.LoginInput;
import edu.college.rental.dto.ApiDtos.Message;
import edu.college.rental.dto.ApiDtos.SessionInfo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final String username;
    private final String password;
    public AuthController(@Value("${app.admin.username}") String username,
                          @Value("${app.admin.password}") String password) {
        this.username = username; this.password = password;
    }
    @PostMapping("/login")
    public SessionInfo login(@Valid @RequestBody LoginInput input, HttpServletRequest request) {
        if (!username.equals(input.username()) || !password.equals(input.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Username or password is incorrect.");
        }
        HttpSession previous = request.getSession(false);
        if (previous != null) previous.invalidate();
        HttpSession session = request.getSession(true);
        session.setAttribute("ADMIN_AUTH", true);
        session.setAttribute("ADMIN_USERNAME", username);
        return new SessionInfo(true, username);
    }
    @PostMapping("/logout")
    public Message logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return new Message("Signed out.");
    }
    @GetMapping("/session")
    public SessionInfo session(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        boolean authenticated = session != null && Boolean.TRUE.equals(session.getAttribute("ADMIN_AUTH"));
        return new SessionInfo(authenticated, authenticated ? username : "");
    }
}
