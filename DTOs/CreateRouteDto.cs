using System.ComponentModel.DataAnnotations;

namespace HY2026_Backend.DTOs;

public class CreateRouteDto
{
    [Required]
    public PointDto StartP { get; set; } = null!;

    [Required]
    public PointDto EndP { get; set; } = null!;

    public string? LookingFor { get; set; }
}
