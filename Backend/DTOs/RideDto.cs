namespace HY2026_Backend.DTOs;

public class RideDto
{
    public long Id { get; set; }
    public long MatchId { get; set; }
    public DateOnly RideDate { get; set; }
}

public class CreateRideDto
{
    public long MatchId { get; set; }
    public DateOnly RideDate { get; set; }
}
