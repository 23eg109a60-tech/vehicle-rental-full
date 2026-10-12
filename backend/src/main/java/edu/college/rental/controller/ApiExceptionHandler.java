package edu.college.rental.controller;

import edu.college.rental.service.BusinessException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, String>> business(BusinessException e) {
        return response(HttpStatus.valueOf(e.getStatus()), e.getMessage());
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> invalid(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage()).findFirst()
            .orElse("The request did not pass validation.");
        return response(HttpStatus.BAD_REQUEST, message);
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> status(ResponseStatusException e) {
        return response(HttpStatus.valueOf(e.getStatusCode().value()), e.getReason() == null ? "Request failed." : e.getReason());
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> conflict(DataIntegrityViolationException e) {
        return response(HttpStatus.CONFLICT, "A record with one of those unique values already exists, or a related record prevents the operation.");
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> unexpected(Exception e) {
        e.printStackTrace();
        String message = e.getMessage() != null && !e.getMessage().isBlank()
            ? e.getMessage()
            : "The request could not be completed: " + e.getClass().getSimpleName();
        return response(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
    private ResponseEntity<Map<String, String>> response(HttpStatus status, String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        body.put("error", message);
        return ResponseEntity.status(status).body(body);
    }
}
