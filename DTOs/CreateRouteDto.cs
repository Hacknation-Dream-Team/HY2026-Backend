using System.ComponentModel.DataAnnotations;

namespace HY2026_Backend.DTOs;

public class CreateRouteDto
{
    [Required]
    [MinLength(2, ErrorMessage = "Route must contain at least 2 points (start and end).")]
    public List<PointDto> Points { get; set; } = new();

    public string? LookingFor { get; set; }
}
