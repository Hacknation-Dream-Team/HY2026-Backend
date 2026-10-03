namespace HY2026_Backend.DTOs;

public class CarModelDto
{
    public long Id { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string FuelType { get; set; } = string.Empty;
    public decimal? LPer100km { get; set; }
    public decimal? KwhPer100km { get; set; }
    public int Co2GKm { get; set; }
}

public class UserCarDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long? CarModelId { get; set; }
    public CarModelDto? CarModel { get; set; }
    public string? ModelName { get; set; }
    public string? Plate { get; set; }
    public string? Color { get; set; }
    public short PassengerSeats { get; set; }
}

public class CreateUserCarDto
{
    public long? CarModelId { get; set; }
    public string? ModelName { get; set; }
    public string? Plate { get; set; }
    public string? Color { get; set; }
    public short PassengerSeats { get; set; } = 4;
}
