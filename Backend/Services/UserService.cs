using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

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

        long organizationId;
        if (createUserDto.OrganizationId.HasValue && createUserDto.OrganizationId.Value > 0)
        {
            organizationId = createUserDto.OrganizationId.Value;
        }
        else
        {
            var existingOrg = await _context.Organizations.AsNoTracking().FirstOrDefaultAsync();
            if (existingOrg != null)
            {
                organizationId = existingOrg.Id;
            }
            else
            {
                var defaultOrg = new Organization
                {
                    Name = "Default Organization",
                    Address = "Default Address",
                    Location = new Point(21.0122, 52.2297) { SRID = 4326 }
                };
                _context.Organizations.Add(defaultOrg);
                await _context.SaveChangesAsync();
                organizationId = defaultOrg.Id;
            }
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password);

        var user = new User
        {
            OrganizationId = organizationId,
            Name = createUserDto.Name,
            Surname = createUserDto.Surname,
            Email = normalizedEmail,
            Role = HY2026_Backend.Helpers.UserRoles.User,
            Phone = createUserDto.Phone,
            Gender = createUserDto.Gender,
            Password = passwordHash,
            ProfileImg = createUserDto.ProfileImg,
            HomeAddress = createUserDto.HomeAddress,
            HomeLocation = createUserDto.HomeLocation == null ? null : new Point(createUserDto.HomeLocation.Longitude, createUserDto.HomeLocation.Latitude) { SRID = 4326 }
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

        if (updateUserDto.OrganizationId.HasValue && updateUserDto.OrganizationId.Value > 0)
        {
            user.OrganizationId = updateUserDto.OrganizationId.Value;
        }

        user.Name = updateUserDto.Name;
        user.Surname = updateUserDto.Surname;
        user.Phone = updateUserDto.Phone;
        user.Gender = updateUserDto.Gender;
        user.ProfileImg = updateUserDto.ProfileImg;
        user.HomeAddress = updateUserDto.HomeAddress;
        if (updateUserDto.HomeLocation != null)
        {
            user.HomeLocation = new Point(updateUserDto.HomeLocation.Longitude, updateUserDto.HomeLocation.Latitude) { SRID = 4326 };
        }

        await _context.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task<UserDto?> UpdateHomeAddressAsync(long id, UpdateHomeAddressDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return null;
        }

        user.HomeAddress = dto.HomeAddress.Trim();
        user.HomeLocation = new Point(dto.HomeLocation.Longitude, dto.HomeLocation.Latitude) { SRID = 4326 };
        await _context.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task<UserDto?> UpdateUserRoleAsync(long id, string role)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return null;
        }

        user.Role = role;
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
        OrganizationId = user.OrganizationId,
        Name = user.Name,
        Surname = user.Surname,
        Email = user.Email,
        Role = string.IsNullOrWhiteSpace(user.Role) ? HY2026_Backend.Helpers.UserRoles.User : user.Role,
        Phone = user.Phone,
        Gender = user.Gender,
        ProfileImg = user.ProfileImg,
        HomeAddress = user.HomeAddress,
        HomeLocation = user.HomeLocation == null ? null : new PointDto { Latitude = user.HomeLocation.Y, Longitude = user.HomeLocation.X },
        Warning = user.HomeLocation == null ? "Home address is not set; you will not receive any matches until you set it." : null
    };
}
