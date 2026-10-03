namespace HY2026_Backend.DTOs;

public class RouteDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public PointDto StartP { get; set; } = null!;
    public PointDto EndP { get; set; } = null!;
    public string? LookingFor { get; set; }
}
