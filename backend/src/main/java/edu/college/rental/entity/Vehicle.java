package edu.college.rental.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Entity
@Table(name = "vehicles", uniqueConstraints = @UniqueConstraint(name = "uk_vehicle_number", columnNames = "vehicle_number"))
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "vehicle_number", nullable = false, unique = true, length = 24)
    private String vehicleNumber;

    @NotBlank @Column(nullable = false, length = 80)
    private String brand;
    @NotBlank @Column(nullable = false, length = 80)
    private String model;
    @NotBlank @Column(name = "vehicle_type", nullable = false, length = 40)
    private String vehicleType;
    @NotBlank @Column(nullable = false, length = 40)
    private String color;
    @NotNull @DecimalMin("0.01")
    @Column(name = "daily_rental_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRentalPrice;
    @Column(name = "availability_status", nullable = false, length = 20)
    private String availabilityStatus = "AVAILABLE";
    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    public Vehicle() {}
    public Long getId() { return id; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String value) { vehicleNumber = value == null ? null : value.trim().toUpperCase(); }
    public String getBrand() { return brand; }
    public void setBrand(String value) { brand = value == null ? null : value.trim(); }
    public String getModel() { return model; }
    public void setModel(String value) { model = value == null ? null : value.trim(); }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String value) { vehicleType = value == null ? null : value.trim(); }
    public String getColor() { return color; }
    public void setColor(String value) { color = value == null ? null : value.trim(); }
    public BigDecimal getDailyRentalPrice() { return dailyRentalPrice; }
    public void setDailyRentalPrice(BigDecimal value) { dailyRentalPrice = value; }
    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String value) { availabilityStatus = value; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String value) { imageUrl = value; }
}
