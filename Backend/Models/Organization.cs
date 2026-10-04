using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace HY2026_Backend.Models;

[Table("organizations")]
public class Organization
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column("address")]
    public string Address { get; set; } = string.Empty;

    [Column("location", TypeName = "geography(Point, 4326)")]
    public Point Location { get; set; } = null!;

    public ICollection<User> Users { get; set; } = new List<User>();
}
