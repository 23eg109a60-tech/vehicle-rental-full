package edu.college.rental.service;

import edu.college.rental.dto.ApiDtos.VehicleDto;
import edu.college.rental.dto.ApiDtos.VehicleInput;
import edu.college.rental.entity.Vehicle;
import edu.college.rental.repository.BookingRepository;
import edu.college.rental.repository.VehicleRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleService {
    private final VehicleRepository vehicles;
    private final BookingRepository bookings;
    public VehicleService(VehicleRepository vehicles, BookingRepository bookings) {
        this.vehicles = vehicles;
        this.bookings = bookings;
    }
    @Transactional(readOnly = true)
    public List<VehicleDto> list(String search, String status, String type) {
        return vehicles.findAll().stream()
            .filter(v -> status == null || status.isBlank() || v.getAvailabilityStatus().equalsIgnoreCase(status))
            .filter(v -> type == null || type.isBlank() || v.getVehicleType().equalsIgnoreCase(type))
            .filter(v -> {
                String haystack = (v.getBrand() + " " + v.getModel() + " " + v.getVehicleType() + " " + v.getVehicleNumber()).toLowerCase(Locale.ROOT);
                return search == null || search.isBlank() || haystack.contains(search.toLowerCase(Locale.ROOT));
            })
            .map(VehicleDto::from).toList();
    }
    @Transactional(readOnly = true)
    public List<VehicleDto> available() {
        return vehicles.findAll().stream().filter(v -> v.getAvailabilityStatus().equals("AVAILABLE")).map(VehicleDto::from).toList();
    }
    @Transactional(readOnly = true)
    public VehicleDto get(Long id) { return VehicleDto.from(find(id)); }
    @Transactional
    public VehicleDto create(VehicleInput input) {
        ensureUnique(input.vehicleNumber(), null);
        Vehicle v = new Vehicle();
        apply(v, input);
        v.setAvailabilityStatus("AVAILABLE");
        return VehicleDto.from(vehicles.save(v));
    }
    @Transactional
    public VehicleDto update(Long id, VehicleInput input) {
        Vehicle v = find(id);
        ensureUnique(input.vehicleNumber(), id);
        apply(v, input);
        return VehicleDto.from(vehicles.save(v));
    }
    @Transactional
    public void delete(Long id) {
        Vehicle v = find(id);
        if (bookings.existsByVehicle_Id(id)) throw new BusinessException(409, "This vehicle has booking history and cannot be deleted.");
        vehicles.delete(v);
    }
    private Vehicle find(Long id) {
        return vehicles.findById(id).orElseThrow(() -> new BusinessException(404, "Vehicle not found."));
    }
    private void ensureUnique(String number, Long id) {
        boolean duplicate = id == null ? vehicles.existsByVehicleNumberIgnoreCase(number) : vehicles.existsByVehicleNumberIgnoreCaseAndIdNot(number, id);
        if (duplicate) throw new BusinessException(409, "That vehicle number is already in use.");
    }
    private void apply(Vehicle v, VehicleInput i) {
        v.setVehicleNumber(i.vehicleNumber()); v.setBrand(i.brand()); v.setModel(i.model());
        v.setVehicleType(i.vehicleType()); v.setColor(i.color()); v.setDailyRentalPrice(i.dailyRentalPrice());
        v.setImageUrl(i.imageUrl());
    }
}
