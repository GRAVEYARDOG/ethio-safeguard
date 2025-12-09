package com.ethiosafeguard.model;

import lombok.*;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trucks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Truck {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, unique = true)
    private String truckId;
    
    @Column(nullable = false)
    private String licensePlate;
    
    @Column(nullable = false)
    private String driverName;
    
    @Column(nullable = false)
    private String driverPhone;
    
    @Column(nullable = false)
    private String currentAidType;
    
    @Column(nullable = false)
    private Double capacity;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TruckStatus status;
    
    @Column(nullable = false)
    private Double currentLatitude;
    
    @Column(nullable = false)
    private Double currentLongitude;
    
    private Double destinationLatitude;
    private Double destinationLongitude;
    
    @Column(nullable = false)
    private Double speed;
    
    @Column(nullable = false)
    private Double fuelLevel;
    
    @Column(nullable = false)
    private LocalDateTime lastUpdated;
    
    @Column(nullable = false)
    private String serverId;
    
    @OneToMany(mappedBy = "truck", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LocationHistory> locationHistory = new ArrayList<>();
    
    public enum TruckStatus {
        ACTIVE, IDLE, MAINTENANCE, EMERGENCY, OFFLINE
    }
}
