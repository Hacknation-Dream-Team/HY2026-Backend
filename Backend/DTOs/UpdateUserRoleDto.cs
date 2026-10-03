using System.ComponentModel.DataAnnotations;

namespace HY2026_Backend.DTOs;

public class UpdateUserRoleDto
{
    [Required(ErrorMessage = "Role is required")]
    public string Role { get; set; } = string.Empty;
}
