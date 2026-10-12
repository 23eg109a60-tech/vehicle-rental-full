package edu.college.rental.repository;

import edu.college.rental.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    boolean existsByDrivingLicenseNumberIgnoreCase(String number);
    boolean existsByDrivingLicenseNumberIgnoreCaseAndIdNot(String number, Long id);
}
