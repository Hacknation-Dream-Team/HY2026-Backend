namespace HY2026_Backend.DTOs;

public class RouteDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public List<PointDto> Points { get; set; } = new();
    public PointDto? StartPoint => Points.Count > 0 ? Points[0] : null;
    public PointDto? EndPoint => Points.Count > 1 ? Points[^1] : null;
    public List<PointDto> MiddlePoints => Points.Count > 2 ? Points.GetRange(1, Points.Count - 2) : new();
    public string? LookingFor { get; set; }
}
