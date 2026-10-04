using HY2026_Backend.Models;

namespace HY2026_Backend.DTOs;

public class RideRequestDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public TripDirection Direction { get; set; }
    public TimeOnly DepartureTime { get; set; }
    public Weekday[] DaysOfWeek { get; set; } = Array.Empty<Weekday>();
    public bool IsActive { get; set; }
}

public class CreateRideRequestDto
{
    public TripDirection Direction { get; set; } = TripDirection.ToWork;
    public TimeOnly DepartureTime { get; set; }
    public Weekday[] DaysOfWeek { get; set; } = Array.Empty<Weekday>();
}

public class UpdateRideRequestDto
{
    public TimeOnly DepartureTime { get; set; }
    public Weekday[] DaysOfWeek { get; set; } = Array.Empty<Weekday>();
}

