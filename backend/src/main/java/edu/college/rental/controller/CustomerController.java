package edu.college.rental.controller;

import edu.college.rental.dto.ApiDtos.CustomerDto;
import edu.college.rental.dto.ApiDtos.CustomerInput;
import edu.college.rental.service.CustomerService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {
    private final CustomerService service;
    public CustomerController(CustomerService service) { this.service = service; }
    @GetMapping public List<CustomerDto> list(@RequestParam(required = false) String search) {
        return service.list(search);
    }
    @GetMapping("/{id}") public CustomerDto get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public CustomerDto create(@Valid @RequestBody CustomerInput input) { return service.create(input); }
    @PutMapping("/{id}") public CustomerDto update(@PathVariable Long id, @Valid @RequestBody CustomerInput input) {
        return service.update(id, input);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
