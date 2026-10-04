using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

[Table("matches")]
public class Match
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("advertisement_id")]
    public long AdvertisementId { get; set; }

    [ForeignKey(nameof(AdvertisementId))]
    public Advertisement? Advertisement { get; set; }

    [Column("request_id")]
    public long RequestId { get; set; }

    [ForeignKey(nameof(RequestId))]
    public RideRequest? Request { get; set; }

    [Column("pickup_seq")]
    public short PickupSeq { get; set; }

    [Column("dropoff_seq")]
    public short DropoffSeq { get; set; }

    [Column("status")]
    public MatchStatus Status { get; set; } = MatchStatus.Pending;

    public ICollection<RideEvent> Events { get; set; } = new List<RideEvent>();
}
