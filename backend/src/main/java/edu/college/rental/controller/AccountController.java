package edu.college.rental.controller;

import edu.college.rental.dto.ApiDtos.BookingDto;
import edu.college.rental.dto.ApiDtos.CustomerAccountSession;
import edu.college.rental.dto.ApiDtos.CustomerBookingInput;
import edu.college.rental.dto.ApiDtos.CustomerLoginInput;
import edu.college.rental.dto.ApiDtos.CustomerRegistrationInput;
import edu.college.rental.dto.ApiDtos.Message;
import edu.college.rental.service.AccountService;
import edu.college.rental.service.BookingService;
import edu.college.rental.service.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    private static final String CUSTOMER_ID = "CUSTOMER_ID";
    private final AccountService accounts;
    private final BookingService bookings;

    public AccountController(AccountService accounts, BookingService bookings) {
        this.accounts = accounts;
        this.bookings = bookings;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerAccountSession register(@Valid @RequestBody CustomerRegistrationInput input, HttpServletRequest request) {
        return startCustomerSession(request, accounts.register(input));
    }

    @PostMapping("/login")
    public CustomerAccountSession login(@Valid @RequestBody CustomerLoginInput input, HttpServletRequest request) {
        return startCustomerSession(request, accounts.login(input));
    }

    @GetMapping("/session")
    public CustomerAccountSession session(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return AccountService.anonymousSession();
        Object value = session.getAttribute(CUSTOMER_ID);
        return value instanceof Long customerId ? accounts.session(customerId) : AccountService.anonymousSession();
    }

    @PostMapping("/logout")
    public Message logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return new Message("Signed out.");
    }

    @GetMapping("/bookings")
    public List<BookingDto> myBookings(HttpSession session) {
        return bookings.listForCustomer(customerId(session));
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingDto createBooking(@Valid @RequestBody CustomerBookingInput input, HttpSession session) {
        return bookings.createForCustomer(customerId(session), input);
    }

    @PutMapping("/bookings/{id}/cancel")
    public BookingDto cancelBooking(@PathVariable Long id, HttpSession session) {
        return bookings.cancelForCustomer(customerId(session), id);
    }

    private CustomerAccountSession startCustomerSession(HttpServletRequest request, CustomerAccountSession account) {
        HttpSession old = request.getSession(false);
        if (old != null) old.invalidate();
        HttpSession session = request.getSession(true);
        session.setAttribute(CUSTOMER_ID, account.customerId());
        session.setAttribute("CUSTOMER_NAME", account.fullName());
        return account;
    }

    private Long customerId(HttpSession session) {
        Object value = session.getAttribute(CUSTOMER_ID);
        if (value instanceof Long id) return id;
        throw new BusinessException(401, "Sign in to your customer account to continue.");
    }
}
