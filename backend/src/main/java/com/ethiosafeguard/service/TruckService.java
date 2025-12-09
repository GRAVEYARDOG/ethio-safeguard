package com.ethiosafeguard.service;

import com.ethiosafeguard.dto.LocationUpdateDTO;
import com.ethiosafeguard.model.LocationHistory;
import com.ethiosafeguard.model.Truck;
import com.ethiosafeguard.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TruckService {
    private final TruckRepository truckRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    @Transactional
    public Truck updateLocation(LocationUpdateDTO dto) {
        Truck truck = truckRepository.findByTruckId(dto.getTruckId())
            .orElseGet(() -> createNewTruck(dto));
        
        // Update truck location
        truck.setCurrentLatitude(dto.getLatitude());
        truck.setCurrentLongitude(dto.getLongitude());
        truck.setSpeed(dto.getSpeed());
        truck.setFuelLevel(dto.getFuelLevel());
        truck.setLastUpdated(LocalDateTime.now());
        
        // Add to location history
        LocationHistory history = LocationHistory.builder()
            .truck(truck)
            .latitude(dto.getLatitude())
            .longitude(dto.getLongitude())
            .speed(dto.getSpeed())
            .fuelLevel(dto.getFuelLevel())
            .timestamp(LocalDateTime.now())
            .serverId("server-1")
            .build();
        
        truck.getLocationHistory().add(history);
        
        Truck saved = truckRepository.save(truck);
        
        // Update Redis cache
        redisTemplate.opsForValue().set("truck:" + saved.getTruckId(), saved);
        
        return saved;
    }
    
    private Truck createNewTruck(LocationUpdateDTO dto) {
        log.info("Creating new truck with ID: {}", dto.getTruckId());
        
        return Truck.builder()
            .truckId(dto.getTruckId())
            .licensePlate("ETH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
            .driverName("Unknown Driver")
            .driverPhone("+251XXXXXXXXX")
            .currentAidType("General Supplies")
            .capacity(5000.0)
            .status(Truck.TruckStatus.ACTIVE)
            .currentLatitude(dto.getLatitude())
            .currentLongitude(dto.getLongitude())
            .speed(dto.getSpeed())
            .fuelLevel(dto.getFuelLevel())
            .lastUpdated(LocalDateTime.now())
            .serverId("server-1")
            .build();
    }
}
