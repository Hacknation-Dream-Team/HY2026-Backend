using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HY2026_Backend.Models;
using Microsoft.IdentityModel.Tokens;

namespace HY2026_Backend.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var secretKey = _configuration["JwtSettings:Secret"] 
            ?? "SuperSecretKeyForHY2026BackendMustBeAtLeast32BytesLong!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "HY2026-Backend";
        var audience = _configuration["JwtSettings:Audience"] ?? "HY2026-Clients";
        var expiryMinutesStr = _configuration["JwtSettings:ExpiryMinutes"];
        var expiryMinutes = double.TryParse(expiryMinutesStr, out var minutes) ? minutes : 4320; // Default 3 days

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, $"{user.Name} {user.Surname}"),
            new Claim(ClaimTypes.Role, string.IsNullOrWhiteSpace(user.Role) ? HY2026_Backend.Helpers.UserRoles.User : user.Role)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
