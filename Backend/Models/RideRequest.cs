using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

[Table("ride_requests")]
public class RideRequest
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("user_id")]
    public long UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Column("direction")]
    public TripDirection Direction { get; set; }

    [Column("departure_time")]
    public TimeOnly DepartureTime { get; set; }

    [Column("days_of_week")]
    public Weekday[] DaysOfWeek { get; set; } = Array.Empty<Weekday>();

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    public ICollection<Match> Matches { get; set; } = new List<Match>();
}
