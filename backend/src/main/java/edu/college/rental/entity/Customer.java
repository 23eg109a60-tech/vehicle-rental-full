package edu.college.rental.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "customers", uniqueConstraints = {
    @UniqueConstraint(name = "uk_customer_email", columnNames = "email"),
    @UniqueConstraint(name = "uk_customer_phone", columnNames = "phone"),
    @UniqueConstraint(name = "uk_customer_license", columnNames = "driving_license_number")
})
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;
    @NotBlank @Email @Column(nullable = false, unique = true, length = 180)
    private String email;
    @NotBlank @Column(nullable = false, unique = true, length = 32)
    private String phone;
    @NotBlank @Column(nullable = false, length = 240)
    private String address;
    @NotBlank @Column(name = "driving_license_number", nullable = false, unique = true, length = 64)
    private String drivingLicenseNumber;

    public Customer() {}
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String value) { fullName = value == null ? null : value.trim(); }
    public String getEmail() { return email; }
    public void setEmail(String value) { email = value == null ? null : value.trim().toLowerCase(); }
    public String getPhone() { return phone; }
    public void setPhone(String value) { phone = value == null ? null : value.trim(); }
    public String getAddress() { return address; }
    public void setAddress(String value) { address = value == null ? null : value.trim(); }
    public String getDrivingLicenseNumber() { return drivingLicenseNumber; }
    public void setDrivingLicenseNumber(String value) { drivingLicenseNumber = value == null ? null : value.trim().toUpperCase(); }
}
