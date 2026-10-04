using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace HY2026_Backend.Models;

/// <summary>Read-only mapping of the route_stops view (full route: start, intermediate points, destination).</summary>
public class RouteStop
{
    [Column("route_id")]
    public long RouteId { get; set; }

    [Column("seq")]
    public short Seq { get; set; }

    [Column("point", TypeName = "geography(Point, 4326)")]
    public Point Point { get; set; } = null!;
}
