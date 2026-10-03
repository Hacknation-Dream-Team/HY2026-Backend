using System.ComponentModel.DataAnnotations;

namespace HY2026_Backend.DTOs;

public class CreateRouteDto
{
    public List<PointDto>? Points { get; set; }
    public PointDto? StartPoint { get; set; }
    public PointDto? EndPoint { get; set; }
    public List<PointDto>? MiddlePoints { get; set; }
    public string? LookingFor { get; set; }

    public List<PointDto> GetResolvedPoints()
    {
        if (Points != null && Points.Count >= 2)
        {
            return Points;
        }

        if (StartPoint != null && EndPoint != null)
        {
            var list = new List<PointDto> { StartPoint };
            if (MiddlePoints != null && MiddlePoints.Count > 0)
            {
                list.AddRange(MiddlePoints);
            }
            list.Add(EndPoint);
            return list;
        }

        return Points ?? new List<PointDto>();
    }
}
