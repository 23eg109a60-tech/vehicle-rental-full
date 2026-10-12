package edu.college.rental.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings", indexes = {
    @Index(name = "idx_booking_vehicle_dates", columnList = "vehicle_id,start_date,end_date"),
    @Index(name = "idx_booking_status", columnList = "booking_status")
})
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, foreignKey = @ForeignKey(name = "fk_booking_customer"))
    private Customer customer;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false, foreignKey = @ForeignKey(name = "fk_booking_vehicle"))
    private Vehicle vehicle;
    @NotNull @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    @NotNull @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    @Column(name = "actual_return_date")
    private LocalDate actualReturnDate;
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;
    @Column(name = "booking_status", nullable = false, length = 20)
    private String bookingStatus = "BOOKED";
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Booking() {}
    public Long getId() { return id; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer value) { customer = value; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle value) { vehicle = value; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate value) { startDate = value; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate value) { endDate = value; }
    public LocalDate getActualReturnDate() { return actualReturnDate; }
    public void setActualReturnDate(LocalDate value) { actualReturnDate = value; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal value) { totalAmount = value; }
    public String getBookingStatus() { return bookingStatus; }
    public void setBookingStatus(String value) { bookingStatus = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
