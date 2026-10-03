using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

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

    [Column("start_p", TypeName = "geography(Point, 4326)")]
    public Point StartP { get; set; } = null!;

    [Column("end_p", TypeName = "geography(Point, 4326)")]
    public Point EndP { get; set; } = null!;

    [Column("looking_for")]
    public string? LookingFor { get; set; }
}
