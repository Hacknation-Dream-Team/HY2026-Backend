using System.ComponentModel.DataAnnotations;

namespace HY2026_Backend.DTOs;

public class UpdateUserDto
{
    public long? OrganizationId { get; set; }

    [Required(ErrorMessage = "First name is required")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    public string Surname { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string? ProfileImg { get; set; }
}
