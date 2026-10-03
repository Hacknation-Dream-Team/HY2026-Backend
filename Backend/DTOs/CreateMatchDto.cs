using System.ComponentModel.DataAnnotations;

namespace HY2026_Backend.DTOs;

public class CreateMatchDto
{
    [Required]
    public long AdvertisementId { get; set; }

    [Required]
    public long RequestId { get; set; }

    [Required]
    public short PickupSeq { get; set; }

    [Required]
    public short DropoffSeq { get; set; }
}
