using System.ComponentModel.DataAnnotations;

namespace HY2026_Backend.DTOs;

public class PointDto
{
    [Range(-90.0, 90.0, ErrorMessage = "Latitude must be between -90 and 90 degrees.")]
    public double Latitude { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "Longitude must be between -180 and 180 degrees.")]
    public double Longitude { get; set; }
}
