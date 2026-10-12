package edu.college.rental.service;

import edu.college.rental.dto.ApiDtos.*;
import edu.college.rental.entity.Booking;
import edu.college.rental.entity.Customer;
import edu.college.rental.entity.Vehicle;
import edu.college.rental.repository.BookingRepository;
import edu.college.rental.repository.CustomerRepository;
import edu.college.rental.repository.VehicleRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

@Service
public class BookingService {
    private final BookingRepository bookings;
    private final VehicleRepository vehicles;
    private final CustomerRepository customers;
    public BookingService(BookingRepository bookings, VehicleRepository vehicles, CustomerRepository customers) {
        this.bookings = bookings; this.vehicles = vehicles; this.customers = customers;
    }
    @Transactional
    public List<BookingDto> list(String search, String status) {
        activateDueBookings();
        return bookings.findAll().stream()
            .filter(b -> status == null || status.isBlank() || b.getBookingStatus().equalsIgnoreCase(status))
            .filter(b -> search == null || search.isBlank()
                || (b.getCustomer().getFullName() + " " + b.getVehicle().getBrand() + " " + b.getVehicle().getModel() + " " + b.getBookingStatus()).toLowerCase(Locale.ROOT).contains(search.toLowerCase(Locale.ROOT)))
            .map(BookingDto::from).toList();
    }
    @Transactional
    public List<BookingDto> listForCustomer(Long customerId) {
        activateDueBookings();
        return bookings.findByCustomer_IdOrderByCreatedAtDesc(customerId).stream().map(BookingDto::from).toList();
    }
    @Transactional(readOnly = true)
    public BookingDto get(Long id) { return BookingDto.from(find(id)); }
    @Transactional
    public BookingDto create(BookingInput i) {
        return BookingDto.from(createBooking(i.customerId(), i.vehicleId(), i.startDate(), i.endDate()));
    }
    @Transactional
    public BookingDto createForCustomer(Long customerId, CustomerBookingInput input) {
        return BookingDto.from(createBooking(customerId, input.vehicleId(), input.startDate(), input.endDate()));
    }
    @Transactional
    public BookingDto update(Long id, BookingInput i) {
        Booking b = find(id);
        if (!"BOOKED".equals(b.getBookingStatus())) throw new BusinessException(409, "Only future BOOKED reservations can be edited.");
        validateDates(i.startDate(), i.endDate());
        if (i.startDate().isBefore(LocalDate.now())) throw new BusinessException(400, "Rental start date cannot be in the past.");
        Vehicle vehicle = vehicle(i.vehicleId());
        if ("MAINTENANCE".equalsIgnoreCase(vehicle.getAvailabilityStatus())) {
            throw new BusinessException(409, "This vehicle is currently under maintenance.");
        }
        if (i.startDate().equals(LocalDate.now()) && !"AVAILABLE".equalsIgnoreCase(vehicle.getAvailabilityStatus())) {
            throw new BusinessException(409, "This vehicle is not currently available for immediate rental.");
        }
        ensureNoOverlap(vehicle.getId(), i.startDate(), i.endDate(), id);
        b.setVehicle(vehicle); b.setCustomer(customer(i.customerId())); b.setStartDate(i.startDate()); b.setEndDate(i.endDate());
        b.setBookingStatus(i.startDate().equals(LocalDate.now()) ? "ACTIVE" : "BOOKED");
        b.setTotalAmount(price(vehicle, i.startDate(), i.endDate()));
        if ("ACTIVE".equals(b.getBookingStatus())) vehicle.setAvailabilityStatus("RENTED");
        return BookingDto.from(bookings.save(b));
    }
    @Transactional
    public BookingDto cancel(Long id) {
        Booking b = find(id);
        return cancel(b);
    }
    @Transactional
    public BookingDto cancelForCustomer(Long customerId, Long id) {
        Booking b = find(id);
        if (!b.getCustomer().getId().equals(customerId)) throw new BusinessException(404, "Booking not found.");
        return cancel(b);
    }
    private BookingDto cancel(Booking b) {
        if (!"BOOKED".equals(b.getBookingStatus())) throw new BusinessException(409, "Only BOOKED reservations can be cancelled.");
        b.setBookingStatus("CANCELLED");
        return BookingDto.from(bookings.save(b));
    }
    @Transactional
    public BookingDto returnVehicle(Long id, ReturnInput input) {
        Booking b = find(id);
        if (!"ACTIVE".equals(b.getBookingStatus())) throw new BusinessException(409, "Only ACTIVE rentals can be returned.");
        LocalDate returned = input.actualReturnDate();
        if (returned.isBefore(b.getStartDate())) throw new BusinessException(400, "Return date cannot be before the rental start date.");
        if (returned.isAfter(LocalDate.now())) throw new BusinessException(400, "Return date cannot be in the future.");
        b.setActualReturnDate(returned);
        b.setTotalAmount(price(b.getVehicle(), b.getStartDate(), returned));
        b.setBookingStatus("COMPLETED");
        b.getVehicle().setAvailabilityStatus("AVAILABLE");
        return BookingDto.from(bookings.save(b));
    }
    @Transactional
    public void delete(Long id) {
        Booking b = find(id);
        if (!List.of("CANCELLED", "COMPLETED").contains(b.getBookingStatus())) {
            throw new BusinessException(409, "Only CANCELLED or COMPLETED bookings can be deleted.");
        }
        bookings.delete(b);
    }
    @Transactional
    public DashboardStats stats() {
        activateDueBookings();
        long totalVehicles = vehicles.count();
        long available = vehicles.findAll().stream().filter(v -> "AVAILABLE".equals(v.getAvailabilityStatus())).count();
        return new DashboardStats(totalVehicles, available, totalVehicles - available, customers.count(),
            bookings.count(), bookings.findTop5ByOrderByCreatedAtDesc().stream().map(BookingDto::from).toList());
    }
    private Booking find(Long id) {
        return bookings.findById(id).orElseThrow(() -> new BusinessException(404, "Booking not found."));
    }
    private Vehicle vehicle(Long id) {
        return vehicles.findById(id).orElseThrow(() -> new BusinessException(404, "Vehicle not found."));
    }
    private Customer customer(Long id) {
        return customers.findById(id).orElseThrow(() -> new BusinessException(404, "Customer not found."));
    }
    private Booking createBooking(Long customerId, Long vehicleId, LocalDate start, LocalDate end) {
        validateDates(start, end);
        if (start.isBefore(LocalDate.now())) throw new BusinessException(400, "Rental start date cannot be in the past.");
        Vehicle vehicle = vehicle(vehicleId);
        if ("MAINTENANCE".equalsIgnoreCase(vehicle.getAvailabilityStatus())) {
            throw new BusinessException(409, "This vehicle is currently under maintenance.");
        }
        if (start.equals(LocalDate.now()) && !"AVAILABLE".equalsIgnoreCase(vehicle.getAvailabilityStatus())) {
            throw new BusinessException(409, "This vehicle is not currently available for immediate rental.");
        }
        ensureNoOverlap(vehicle.getId(), start, end, null);
        Booking booking = new Booking();
        booking.setVehicle(vehicle);
        booking.setCustomer(customer(customerId));
        booking.setStartDate(start);
        booking.setEndDate(end);
        booking.setBookingStatus(start.equals(LocalDate.now()) ? "ACTIVE" : "BOOKED");
        booking.setTotalAmount(price(vehicle, start, end));
        if ("ACTIVE".equals(booking.getBookingStatus())) vehicle.setAvailabilityStatus("RENTED");
        return bookings.save(booking);
    }
    private void validateDates(LocalDate start, LocalDate end) {
        if (start == null || end == null || !end.isAfter(start)) throw new BusinessException(400, "Return date must be after the rental start date.");
    }
    private void ensureNoOverlap(Long vehicleId, LocalDate start, LocalDate end, Long excludeId) {
        if (vehicles.countOverlappingBookings(vehicleId, start, end, excludeId) > 0) {
            throw new BusinessException(409, "This vehicle already has a booking during those dates.");
        }
    }
    private BigDecimal price(Vehicle v, LocalDate start, LocalDate end) {
        long days = Math.max(1, ChronoUnit.DAYS.between(start, end));
        return v.getDailyRentalPrice().multiply(BigDecimal.valueOf(days));
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void activateDueBookings() {
        for (Booking booking : bookings.findByBookingStatusAndStartDateLessThanEqual("BOOKED", LocalDate.now())) {
            booking.setBookingStatus("ACTIVE");
            booking.getVehicle().setAvailabilityStatus("RENTED");
        }
    }
}
