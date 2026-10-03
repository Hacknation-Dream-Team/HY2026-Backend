using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HY2026_Backend.Models;

[Table("users_cars")]
public class UserCar
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("user_id")]
    public long UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Column("car_model_id")]
    public long? CarModelId { get; set; }

    [ForeignKey(nameof(CarModelId))]
    public CarModel? CarModel { get; set; }

    [Column("model_name")]
    public string? ModelName { get; set; }

    [Column("plate")]
    public string? Plate { get; set; }

    [Column("color")]
    public string? Color { get; set; }

    [Column("passenger_seats")]
    public short PassengerSeats { get; set; }
}
