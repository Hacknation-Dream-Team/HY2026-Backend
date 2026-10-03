using HY2026_Backend.Models;

namespace HY2026_Backend.DTOs;

public class RideRequestDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public PointDto StartP { get; set; } = null!;
    public PointDto EndP { get; set; } = null!;
    public TimeOnly DepartureTime { get; set; }
    public Weekday[] DaysOfWeek { get; set; } = Array.Empty<Weekday>();
    public bool IsActive { get; set; }
}

public class CreateRideRequestDto
{
    public PointDto StartP { get; set; } = null!;
    public PointDto EndP { get; set; } = null!;
    public TimeOnly DepartureTime { get; set; }
    public Weekday[] DaysOfWeek { get; set; } = Array.Empty<Weekday>();
}
