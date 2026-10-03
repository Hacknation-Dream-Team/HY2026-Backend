using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<UserDto?> GetUserByIdAsync(long id);
    Task<AuthResponseDto> CreateUserAsync(CreateUserDto createUserDto);
    Task<UserDto?> UpdateUserAsync(long id, UpdateUserDto updateUserDto);
    Task<UserDto?> UpdateUserRoleAsync(long id, string role);
    Task<bool> DeleteUserAsync(long id);
    Task<AuthResponseDto?> AuthenticateAsync(LoginDto loginDto);
}
