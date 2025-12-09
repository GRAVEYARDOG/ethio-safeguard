package com.ethiosafeguard.dto;

import lombok.Data;
import javax.validation.constraints.*;

@Data
public class LocationUpdateDTO {
    @NotBlank(message = "Truck ID is required")
    private String truckId;
    
    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    private Double latitude;
    
    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    private Double longitude;
    
    @NotNull(message = "Speed is required")
    @PositiveOrZero(message = "Speed cannot be negative")
    private Double speed;
    
    @NotNull(message = "Fuel level is required")
    @DecimalMin(value = "0.0", message = "Fuel level must be >= 0")
    @DecimalMax(value = "100.0", message = "Fuel level must be <= 100")
    private Double fuelLevel;
}
