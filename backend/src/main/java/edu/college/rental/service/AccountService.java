package edu.college.rental.service;

import edu.college.rental.dto.ApiDtos.CustomerAccountSession;
import edu.college.rental.dto.ApiDtos.CustomerLoginInput;
import edu.college.rental.dto.ApiDtos.CustomerRegistrationInput;
import edu.college.rental.entity.Customer;
import edu.college.rental.entity.CustomerAccount;
import edu.college.rental.repository.CustomerAccountRepository;
import edu.college.rental.repository.CustomerRepository;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
    private final CustomerRepository customers;
    private final CustomerAccountRepository accounts;
    private final PasswordHasher passwordHasher;

    public AccountService(CustomerRepository customers, CustomerAccountRepository accounts, PasswordHasher passwordHasher) {
        this.customers = customers;
        this.accounts = accounts;
        this.passwordHasher = passwordHasher;
    }

    @Transactional
    public CustomerAccountSession register(CustomerRegistrationInput input) {
        String email = input.email().trim().toLowerCase(Locale.ROOT);
        if (customers.existsByEmailIgnoreCase(email)
            || customers.existsByPhone(input.phone().trim())
            || customers.existsByDrivingLicenseNumberIgnoreCase(input.drivingLicenseNumber().trim())) {
            throw new BusinessException(409, "An account with that email, phone, or driving license already exists.");
        }

        Customer customer = new Customer();
        customer.setFullName(input.fullName());
        customer.setEmail(email);
        customer.setPhone(input.phone());
        customer.setAddress(input.address());
        customer.setDrivingLicenseNumber(input.drivingLicenseNumber());
        customer = customers.save(customer);

        CustomerAccount account = new CustomerAccount();
        account.setCustomer(customer);
        account.setPasswordHash(passwordHasher.hash(input.password()));
        accounts.save(account);
        return sessionFor(customer);
    }

    @Transactional(readOnly = true)
    public CustomerAccountSession login(CustomerLoginInput input) {
        CustomerAccount account = accounts.findByCustomer_EmailIgnoreCase(input.email().trim())
            .orElseThrow(() -> new BusinessException(401, "Email or password is incorrect."));
        if (!passwordHasher.matches(input.password(), account.getPasswordHash())) {
            throw new BusinessException(401, "Email or password is incorrect.");
        }
        return sessionFor(account.getCustomer());
    }

    @Transactional(readOnly = true)
    public CustomerAccountSession session(Long customerId) {
        return customers.findById(customerId)
            .filter(customer -> accounts.existsByCustomer_Id(customerId))
            .map(this::sessionFor)
            .orElseGet(AccountService::anonymousSession);
    }

    public static CustomerAccountSession anonymousSession() {
        return new CustomerAccountSession(false, null, "", "");
    }

    private CustomerAccountSession sessionFor(Customer customer) {
        return new CustomerAccountSession(true, customer.getId(), customer.getFullName(), customer.getEmail());
    }
}
