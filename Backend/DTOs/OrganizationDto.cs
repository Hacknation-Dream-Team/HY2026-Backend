namespace HY2026_Backend.DTOs;

public class OrganizationDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public PointDto Location { get; set; } = null!;
}

public class CreateOrganizationDto
{
    public string Name { get; set; } = string.Empty;
    public PointDto Location { get; set; } = null!;
}
