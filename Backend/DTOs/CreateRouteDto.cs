using HY2026_Backend.Models;

namespace HY2026_Backend.DTOs;

public class CreateRouteDto
{
    public TripDirection Direction { get; set; } = TripDirection.ToWork;
    public List<PointDto>? Points { get; set; }
    public List<PointDto>? MiddlePoints { get; set; }
    public PointDto? StartPoint { get; set; }
    public PointDto? EndPoint { get; set; }
    public string? LookingFor { get; set; }

    public List<PointDto> GetIntermediatePoints()
    {
        if (MiddlePoints != null && MiddlePoints.Count > 0)
        {
            return MiddlePoints;
        }

        if (Points != null && Points.Count > 0)
        {
            // If full points list including start & end was passed (>=2 points), extract middle points
            if (Points.Count >= 2 && StartPoint == null && EndPoint == null)
            {
                // If caller passed e.g. [Start, Middle1, Middle2, End], return middle points
                if (Points.Count > 2)
                {
                    return Points.GetRange(1, Points.Count - 2);
                }
                return new List<PointDto>();
            }
            return Points;
        }

        return new List<PointDto>();
    }
}
