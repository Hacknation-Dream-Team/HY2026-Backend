using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

[Table("car_models")]
public class CarModel
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("brand")]
    public string Brand { get; set; } = string.Empty;

    [Required]
    [Column("model")]
    public string Model { get; set; } = string.Empty;

    [Required]
    [Column("fuel_type")]
    public string FuelType { get; set; } = string.Empty;

    [Column("l_per_100km")]
    public decimal? LPer100km { get; set; }

    [Column("kwh_per_100km")]
    public decimal? KwhPer100km { get; set; }

    [Column("co2_g_km")]
    public int Co2GKm { get; set; }

    [Column("seats")]
    public short? Seats { get; set; }
}
