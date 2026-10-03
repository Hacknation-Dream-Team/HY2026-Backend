using HY2026_Backend.Models;

namespace HY2026_Backend.DTOs;

public class RouteDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public TripDirection Direction { get; set; }
    public List<PointDto> Points { get; set; } = new();
    public List<PointDto> MiddlePoints => Points;
    public string? LookingFor { get; set; }
}
