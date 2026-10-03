using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("organization_id")]
    public long OrganizationId { get; set; }

    [ForeignKey(nameof(OrganizationId))]
    public Organization? Organization { get; set; }

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column("surname")]
    public string Surname { get; set; } = string.Empty;

    [Required]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("gender")]
    public UserGender? Gender { get; set; }

    [Required]
    [Column("password")]
    public string Password { get; set; } = string.Empty;

    [Column("profile_img")]
    public string? ProfileImg { get; set; }

    [Required]
    [Column("role")]
    public string Role { get; set; } = "User";

    public ICollection<UserCar> UserCars { get; set; } = new List<UserCar>();
    public ICollection<RouteModel> Routes { get; set; } = new List<RouteModel>();
    public ICollection<RideRequest> RideRequests { get; set; } = new List<RideRequest>();
}
