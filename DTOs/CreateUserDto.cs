using System.ComponentModel.DataAnnotations;

namespace HY2026_Backend.DTOs;

public class CreateUserDto
{
    public long? OrganizationId { get; set; }

    [Required(ErrorMessage = "First name is required")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    public string Surname { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;

    public string? ProfileImg { get; set; }
}
