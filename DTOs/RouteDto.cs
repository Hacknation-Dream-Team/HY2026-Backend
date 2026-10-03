namespace HY2026_Backend.DTOs;

public class RouteDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public List<PointDto> Points { get; set; } = new();
    public string? LookingFor { get; set; }
}
