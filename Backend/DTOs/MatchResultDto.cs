using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.DTOs;

public class MatchResultDto
{
    [Column("advertisement_id")]
    public long AdvertisementId { get; set; }

    [Column("driver_id")]
    public long DriverId { get; set; }

    [Column("pickup_seq")]
    public short PickupSeq { get; set; }

    [Column("dropoff_seq")]
    public short DropoffSeq { get; set; }

    [Column("pickup_distance_m")]
    public int PickupDistanceM { get; set; }

    [Column("dropoff_distance_m")]
    public int DropoffDistanceM { get; set; }

    [Column("departure_time")]
    public TimeOnly DepartureTime { get; set; }

    [Column("free_seats")]
    public int FreeSeats { get; set; }
}
