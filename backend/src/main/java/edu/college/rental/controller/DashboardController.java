package edu.college.rental.controller;

import edu.college.rental.dto.ApiDtos.DashboardStats;
import edu.college.rental.service.BookingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final BookingService bookings;
    public DashboardController(BookingService bookings) { this.bookings = bookings; }
    @GetMapping("/stats")
    public DashboardStats stats() { return bookings.stats(); }
}
