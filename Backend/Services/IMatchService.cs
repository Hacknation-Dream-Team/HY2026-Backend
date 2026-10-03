using HY2026_Backend.DTOs;
using HY2026_Backend.Models;

namespace HY2026_Backend.Services;

public interface IMatchService
{
    Task<IEnumerable<MatchResultDto>> FindMatchesAsync(long currentUserId, long? requestId = null, int? maxDistanceMeters = null, int? timeWindowMinutes = null);
    Task<MatchDto> CreateMatchAsync(long currentUserId, CreateMatchDto createMatchDto);
    Task<IEnumerable<MatchDto>> GetMatchesForUserAsync(long currentUserId);
    Task<MatchDto?> UpdateMatchStatusAsync(long matchId, long currentUserId, MatchStatus status);
}
