using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace HY2026_Backend.Models;

[Table("route_points")]
public class RoutePoint
{
    [Column("route_id")]
    public long RouteId { get; set; }

    [ForeignKey(nameof(RouteId))]
    public RouteModel? Route { get; set; }

    [Column("seq")]
    public short Seq { get; set; }

    [Required]
    [Column("point", TypeName = "geography(Point, 4326)")]
    public Point Point { get; set; } = null!;
}
