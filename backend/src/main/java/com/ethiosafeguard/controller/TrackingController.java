package com.ethiosafeguard.controller;

import com.ethiosafeguard.dto.LocationUpdateDTO;
import com.ethiosafeguard.model.Truck;
import com.ethiosafeguard.service.TruckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;

@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
@Validated
public class TrackingController {
    
    private final TruckService truckService;
    
    @PostMapping("/location")
    public ResponseEntity<Truck> updateLocation(
            @Valid @RequestBody LocationUpdateDTO locationUpdate) {
        
        Truck updatedTruck = truckService.updateLocation(locationUpdate);
        return ResponseEntity.ok(updatedTruck);
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("ETHIO Safeguard Backend is UP!");
    }
}
