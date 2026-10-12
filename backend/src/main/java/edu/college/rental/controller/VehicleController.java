package edu.college.rental.controller;

import edu.college.rental.dto.ApiDtos.VehicleDto;
import edu.college.rental.dto.ApiDtos.VehicleInput;
import edu.college.rental.service.VehicleService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    private final VehicleService service;
    public VehicleController(VehicleService service) { this.service = service; }
    @GetMapping public List<VehicleDto> list(@RequestParam(required = false) String search,
                                             @RequestParam(required = false) String status,
                                             @RequestParam(required = false) String vehicleType) {
        return service.list(search, status, vehicleType);
    }
    @GetMapping("/available") public List<VehicleDto> available() { return service.available(); }
    @GetMapping("/{id}") public VehicleDto get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public VehicleDto create(@Valid @RequestBody VehicleInput input) { return service.create(input); }
    @PutMapping("/{id}") public VehicleDto update(@PathVariable Long id, @Valid @RequestBody VehicleInput input) {
        return service.update(id, input);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
