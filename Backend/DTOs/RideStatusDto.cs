using HY2026_Backend.Models;

namespace HY2026_Backend.DTOs;

public class RouteStopDto
{
    public long RouteId { get; set; }
    public short Seq { get; set; }
    public PointDto Point { get; set; } = new();
}

public class RideStatusDto
{
    public long AdvertisementId { get; set; }
    public long? MatchId { get; set; }
    public DateOnly RideDate { get; set; }
    public RideEventType Event { get; set; }
    public long CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PassengerRidingDto
{
    public long MatchId { get; set; }
    public long AdvertisementId { get; set; }
    public DateOnly RideDate { get; set; }
    public bool IsRiding { get; set; }
    public string? Reason { get; set; }
}

public class UpdateHomeAddressDto
{
    [System.ComponentModel.DataAnnotations.Required]
    public string HomeAddress { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Required]
    public PointDto HomeLocation { get; set; } = new();
}
