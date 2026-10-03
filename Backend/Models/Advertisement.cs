using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

[Table("advertisements")]
public class Advertisement
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("route_id")]
    public long RouteId { get; set; }

    [ForeignKey(nameof(RouteId))]
    public RouteModel? Route { get; set; }

    [Column("users_car_id")]
    public long? UsersCarId { get; set; }

    [ForeignKey(nameof(UsersCarId))]
    public UserCar? UsersCar { get; set; }

    [Column("seats")]
    public short Seats { get; set; }

    [Column("departure_time")]
    public TimeOnly DepartureTime { get; set; }

    [Column("days_of_week")]
    public Weekday[] DaysOfWeek { get; set; } = Array.Empty<Weekday>();

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("description")]
    public string? Description { get; set; }

    public ICollection<Match> Matches { get; set; } = new List<Match>();
}
