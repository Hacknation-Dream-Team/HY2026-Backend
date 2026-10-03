using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public UserService(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        return await _context.Users
            .AsNoTracking()
            .Select(u => MapToDto(u))
            .ToListAsync();
    }

    public async Task<UserDto?> GetUserByIdAsync(long id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        return user == null ? null : MapToDto(user);
    }

    public async Task<AuthResponseDto> CreateUserAsync(CreateUserDto createUserDto)
    {
        var normalizedEmail = createUserDto.Email.Trim().ToLower();
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (existingUser != null)
        {
            throw new InvalidOperationException("A user with the specified email address already exists.");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password);

        var user = new User
        {
            Name = createUserDto.Name,
            Surname = createUserDto.Surname,
            Email = normalizedEmail,
            Phone = createUserDto.Phone,
            Password = passwordHash,
            ProfileImg = createUserDto.ProfileImg
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _tokenService.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            User = MapToDto(user)
        };
    }

    public async Task<UserDto?> UpdateUserAsync(long id, UpdateUserDto updateUserDto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return null;
        }

        user.Name = updateUserDto.Name;
        user.Surname = updateUserDto.Surname;
        user.Phone = updateUserDto.Phone;
        user.ProfileImg = updateUserDto.ProfileImg;

        await _context.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task<bool> DeleteUserAsync(long id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return false;
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AuthResponseDto?> AuthenticateAsync(LoginDto loginDto)
    {
        var normalizedEmail = loginDto.Email.Trim().ToLower();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null)
        {
            return null;
        }

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password);
        if (!isPasswordValid)
        {
            return null;
        }

        var token = _tokenService.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            User = MapToDto(user)
        };
    }

    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Surname = user.Surname,
        Email = user.Email,
        Phone = user.Phone,
        ProfileImg = user.ProfileImg
    };
}
