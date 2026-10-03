using HY2026_Backend.Models;

namespace HY2026_Backend.DTOs;

public class AdvertisementDto
{
    public long Id { get; set; }
    public long RouteId { get; set; }
    public long? UsersCarId { get; set; }
    public short Seats { get; set; }
    public TimeOnly DepartureTime { get; set; }
    public Weekday[] DaysOfWeek { get; set; } = Array.Empty<Weekday>();
    public bool IsActive { get; set; }
    public string? Description { get; set; }
}

public class CreateAdvertisementDto
{
    public long RouteId { get; set; }
    public long? UsersCarId { get; set; }
    public short Seats { get; set; }
    public TimeOnly DepartureTime { get; set; }
    public Weekday[] DaysOfWeek { get; set; } = Array.Empty<Weekday>();
    public string? Description { get; set; }
}
