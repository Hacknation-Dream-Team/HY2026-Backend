using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

[Table("routes")]
public class RouteModel
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

    public ICollection<RoutePoint> Points { get; set; } = new List<RoutePoint>();
    public ICollection<Advertisement> Advertisements { get; set; } = new List<Advertisement>();
}
