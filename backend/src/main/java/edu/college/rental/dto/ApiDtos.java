package edu.college.rental.dto;

import edu.college.rental.entity.Booking;
import edu.college.rental.entity.Customer;
import edu.college.rental.entity.Vehicle;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() {}

    public record VehicleInput(
        @NotBlank @Size(max = 24) String vehicleNumber,
        @NotBlank @Size(max = 80) String brand,
        @NotBlank @Size(max = 80) String model,
        @NotBlank @Size(max = 40) String vehicleType,
        @NotBlank @Size(max = 40) String color,
        @NotNull @DecimalMin("0.01") BigDecimal dailyRentalPrice,
        @Size(max = 1000) String imageUrl
    ) {}

    public record VehicleDto(Long id, String vehicleNumber, String brand, String model,
                             String vehicleType, String color, BigDecimal dailyRentalPrice,
                             String availabilityStatus, String imageUrl) {
        public static VehicleDto from(Vehicle v) {
            return new VehicleDto(v.getId(), v.getVehicleNumber(), v.getBrand(), v.getModel(),
                v.getVehicleType(), v.getColor(), v.getDailyRentalPrice(), v.getAvailabilityStatus(), v.getImageUrl());
        }
    }

    public record CustomerInput(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(max = 32) String phone,
        @NotBlank @Size(max = 240) String address,
        @NotBlank @Size(max = 64) String drivingLicenseNumber
    ) {}

    public record CustomerDto(Long id, String fullName, String email, String phone,
                              String address, String drivingLicenseNumber) {
        public static CustomerDto from(Customer c) {
            return new CustomerDto(c.getId(), c.getFullName(), c.getEmail(), c.getPhone(),
                c.getAddress(), c.getDrivingLicenseNumber());
        }
    }

    public record BookingInput(
        @NotNull @Positive Long customerId,
        @NotNull @Positive Long vehicleId,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate
    ) {}

    public record ReturnInput(@NotNull LocalDate actualReturnDate) {}

    public record BookingDto(Long id, Long customerId, String customerName, Long vehicleId,
                             String vehicleLabel, LocalDate startDate, LocalDate endDate,
                             LocalDate actualReturnDate, BigDecimal totalAmount,
                             String bookingStatus, LocalDateTime createdAt) {
        public static BookingDto from(Booking b) {
            Vehicle v = b.getVehicle();
            return new BookingDto(b.getId(), b.getCustomer().getId(), b.getCustomer().getFullName(),
                v.getId(), v.getBrand() + " " + v.getModel(), b.getStartDate(), b.getEndDate(),
                b.getActualReturnDate(), b.getTotalAmount(), b.getBookingStatus(), b.getCreatedAt());
        }
    }

    public record DashboardStats(long totalVehicles, long availableVehicles, long rentedVehicles,
                                 long totalCustomers, long totalBookings, List<BookingDto> recentBookings) {}

    public record LoginInput(@NotBlank String username, @NotBlank String password) {}
    public record SessionInfo(boolean authenticated, String username) {}
    public record CustomerRegistrationInput(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(min = 5, max = 32) String phone,
        @NotBlank @Size(max = 240) String address,
        @NotBlank @Size(max = 64) String drivingLicenseNumber,
        @NotBlank @Size(min = 8, max = 128) String password
    ) {}
    public record CustomerLoginInput(
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(max = 128) String password
    ) {}
    public record CustomerAccountSession(boolean authenticated, Long customerId, String fullName, String email) {}
    public record CustomerBookingInput(
        @NotNull @Positive Long vehicleId,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate
    ) {}
    public record Message(String message) {}
}
