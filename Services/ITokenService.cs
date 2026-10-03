using HY2026_Backend.Models;

namespace HY2026_Backend.Services;

public interface ITokenService
{
    string GenerateToken(User user);
}
