using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

/// <summary>Read-only mapping of the ride_status view (latest event per advertisement, match and day).</summary>
public class RideStatus
{
    [Column("advertisement_id")]
    public long AdvertisementId { get; set; }

    [Column("match_id")]
    public long? MatchId { get; set; }

    [Column("ride_date")]
    public DateOnly RideDate { get; set; }

    [Column("event")]
    public RideEventType Event { get; set; }

    [Column("created_by")]
    public long CreatedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
