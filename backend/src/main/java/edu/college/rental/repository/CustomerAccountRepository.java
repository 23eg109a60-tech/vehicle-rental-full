package edu.college.rental.repository;

import edu.college.rental.entity.CustomerAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerAccountRepository extends JpaRepository<CustomerAccount, Long> {
    Optional<CustomerAccount> findByCustomer_EmailIgnoreCase(String email);
    boolean existsByCustomer_Id(Long customerId);
    void deleteByCustomer_Id(Long customerId);
}
