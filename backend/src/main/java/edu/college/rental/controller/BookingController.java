package edu.college.rental.controller;

import edu.college.rental.dto.ApiDtos.BookingDto;
import edu.college.rental.dto.ApiDtos.BookingInput;
import edu.college.rental.dto.ApiDtos.ReturnInput;
import edu.college.rental.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService service;
    public BookingController(BookingService service) { this.service = service; }
    @GetMapping public List<BookingDto> list(@RequestParam(required = false) String search,
                                             @RequestParam(required = false) String status) {
        return service.list(search, status);
    }
    @GetMapping("/{id}") public BookingDto get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public BookingDto create(@Valid @RequestBody BookingInput input) { return service.create(input); }
    @PutMapping("/{id}") public BookingDto update(@PathVariable Long id, @Valid @RequestBody BookingInput input) {
        return service.update(id, input);
    }
    @PutMapping("/{id}/cancel") public BookingDto cancel(@PathVariable Long id) { return service.cancel(id); }
    @PutMapping("/{id}/return") public BookingDto returnVehicle(@PathVariable Long id, @Valid @RequestBody ReturnInput input) {
        return service.returnVehicle(id, input);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
