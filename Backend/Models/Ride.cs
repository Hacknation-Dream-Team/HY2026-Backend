using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

[Table("rides")]
public class Ride
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("match_id")]
    public long MatchId { get; set; }

    [ForeignKey(nameof(MatchId))]
    public Match? Match { get; set; }

    [Column("ride_date")]
    public DateOnly RideDate { get; set; }
}
