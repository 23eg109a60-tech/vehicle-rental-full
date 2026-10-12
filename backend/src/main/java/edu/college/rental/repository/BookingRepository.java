package edu.college.rental.repository;

import edu.college.rental.entity.Booking;
import java.util.List;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByVehicle_Id(Long vehicleId);
    boolean existsByCustomer_Id(Long customerId);
    List<Booking> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);
    List<Booking> findTop5ByOrderByCreatedAtDesc();
    List<Booking> findByBookingStatusAndStartDateLessThanEqual(String bookingStatus, LocalDate date);
}
