using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

[Table("ride_events")]
public class RideEvent
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("advertisement_id")]
    public long AdvertisementId { get; set; }

    [ForeignKey(nameof(AdvertisementId))]
    public Advertisement? Advertisement { get; set; }

    [Column("match_id")]
    public long? MatchId { get; set; }

    [ForeignKey(nameof(MatchId))]
    public Match? Match { get; set; }

    [Column("ride_date")]
    public DateOnly RideDate { get; set; }

    [Column("event")]
    public RideEventType Event { get; set; }

    [Column("created_by")]
    public long CreatedBy { get; set; }

    [ForeignKey(nameof(CreatedBy))]
    public User? CreatedByUser { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
