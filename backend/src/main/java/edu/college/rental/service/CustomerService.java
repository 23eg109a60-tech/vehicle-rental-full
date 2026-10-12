package edu.college.rental.service;

import edu.college.rental.dto.ApiDtos.CustomerDto;
import edu.college.rental.dto.ApiDtos.CustomerInput;
import edu.college.rental.entity.Customer;
import edu.college.rental.repository.BookingRepository;
import edu.college.rental.repository.CustomerAccountRepository;
import edu.college.rental.repository.CustomerRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {
    private final CustomerRepository customers;
    private final BookingRepository bookings;
    private final CustomerAccountRepository accounts;
    public CustomerService(CustomerRepository customers, BookingRepository bookings, CustomerAccountRepository accounts) {
        this.customers = customers; this.bookings = bookings; this.accounts = accounts;
    }
    @Transactional(readOnly = true)
    public List<CustomerDto> list(String search) {
        return customers.findAll().stream().filter(c -> search == null || search.isBlank()
            || (c.getFullName() + " " + c.getPhone() + " " + c.getEmail()).toLowerCase(Locale.ROOT).contains(search.toLowerCase(Locale.ROOT)))
            .map(CustomerDto::from).toList();
    }
    @Transactional(readOnly = true)
    public CustomerDto get(Long id) { return CustomerDto.from(find(id)); }
    @Transactional
    public CustomerDto create(CustomerInput i) {
        ensureUnique(i, null);
        Customer c = new Customer(); apply(c, i); return CustomerDto.from(customers.save(c));
    }
    @Transactional
    public CustomerDto update(Long id, CustomerInput i) {
        Customer c = find(id); ensureUnique(i, id); apply(c, i); return CustomerDto.from(customers.save(c));
    }
    @Transactional
    public void delete(Long id) {
        Customer c = find(id);
        if (bookings.existsByCustomer_Id(id)) throw new BusinessException(409, "This customer has booking history and cannot be deleted.");
        accounts.deleteByCustomer_Id(id);
        customers.delete(c);
    }
    private Customer find(Long id) {
        return customers.findById(id).orElseThrow(() -> new BusinessException(404, "Customer not found."));
    }
    private void ensureUnique(CustomerInput i, Long id) {
        boolean email = id == null ? customers.existsByEmailIgnoreCase(i.email()) : customers.existsByEmailIgnoreCaseAndIdNot(i.email(), id);
        boolean phone = id == null ? customers.existsByPhone(i.phone()) : customers.existsByPhoneAndIdNot(i.phone(), id);
        boolean license = id == null ? customers.existsByDrivingLicenseNumberIgnoreCase(i.drivingLicenseNumber()) : customers.existsByDrivingLicenseNumberIgnoreCaseAndIdNot(i.drivingLicenseNumber(), id);
        if (email || phone || license) throw new BusinessException(409, "A customer with that email, phone, or license number already exists.");
    }
    private void apply(Customer c, CustomerInput i) {
        c.setFullName(i.fullName()); c.setEmail(i.email()); c.setPhone(i.phone());
        c.setAddress(i.address()); c.setDrivingLicenseNumber(i.drivingLicenseNumber());
    }
}
