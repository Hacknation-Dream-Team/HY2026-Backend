using HY2026_Backend.Models;

namespace HY2026_Backend.DTOs;

public class UserDto
{
    public long Id { get; set; }
    public long OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public string? Phone { get; set; }
    public UserGender? Gender { get; set; }
    public string? ProfileImg { get; set; }
    public string? HomeAddress { get; set; }
    public PointDto? HomeLocation { get; set; }
    /// <summary>Set when the account has a problem, e.g. no home location (no matches will be returned).</summary>
    public string? Warning { get; set; }
}
