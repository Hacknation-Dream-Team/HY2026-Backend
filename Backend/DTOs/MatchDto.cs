using HY2026_Backend.Models;

namespace HY2026_Backend.DTOs;

public class MatchDto
{
    public long Id { get; set; }
    public long AdvertisementId { get; set; }
    public long RequestId { get; set; }
    public short PickupSeq { get; set; }
    public short DropoffSeq { get; set; }
    public MatchStatus Status { get; set; }
}
