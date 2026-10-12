package edu.college.rental.repository;

import edu.college.rental.entity.Vehicle;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    boolean existsByVehicleNumberIgnoreCase(String vehicleNumber);
    boolean existsByVehicleNumberIgnoreCaseAndIdNot(String vehicleNumber, Long id);
    @Query("select count(b) from Booking b where b.vehicle.id = :vehicleId and b.bookingStatus in ('BOOKED', 'ACTIVE') and b.startDate < :endDate and b.endDate > :startDate and (:excludeId is null or b.id <> :excludeId)")
    long countOverlappingBookings(@Param("vehicleId") Long vehicleId, @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate, @Param("excludeId") Long excludeId);
}
