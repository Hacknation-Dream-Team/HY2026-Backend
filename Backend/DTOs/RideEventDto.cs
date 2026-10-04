using HY2026_Backend.Models;

namespace HY2026_Backend.DTOs;

public class RideEventDto
{
    public long Id { get; set; }
    public long AdvertisementId { get; set; }
    public long? MatchId { get; set; }
    public DateOnly RideDate { get; set; }
    public RideEventType Event { get; set; }
    public long CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateRideEventDto
{
    public long AdvertisementId { get; set; }
    public long? MatchId { get; set; }
    public DateOnly RideDate { get; set; }
    public RideEventType Event { get; set; }
}
