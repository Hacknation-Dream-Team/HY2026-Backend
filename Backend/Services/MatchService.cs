using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Services;

public class MatchService : IMatchService
{
    private readonly AppDbContext _context;

    public MatchService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MatchResultDto>> FindMatchesAsync(
        long currentUserId, 
        long? requestId = null, 
        int? maxDistanceMeters = null, 
        int? timeWindowMinutes = null)
    {
        long targetRequestId;

        if (requestId.HasValue && requestId.Value > 0)
        {
            targetRequestId = requestId.Value;
        }
        else
        {
            var activeRequest = await _context.RideRequests
                .AsNoTracking()
                .Where(r => r.UserId == currentUserId && r.IsActive)
                .OrderByDescending(r => r.Id)
                .FirstOrDefaultAsync();

            if (activeRequest == null)
            {
                throw new InvalidOperationException("No active ride request was found for the current user.");
            }

            targetRequestId = activeRequest.Id;
        }

        double radiusMeters = maxDistanceMeters.HasValue && maxDistanceMeters.Value > 0 
            ? maxDistanceMeters.Value 
            : 500.0;
        int timeMinutes = timeWindowMinutes.HasValue && timeWindowMinutes.Value > 0 
            ? timeWindowMinutes.Value 
            : 15;
        
        var intervalStr = $"{timeMinutes} minutes";

        var results = await _context.MatchResults
            .FromSqlInterpolated($"SELECT advertisement_id, driver_id, pickup_seq, dropoff_seq, pickup_distance_m, dropoff_distance_m, departure_time, free_seats FROM find_matches({targetRequestId}, {radiusMeters}, {intervalStr}::interval)")
            .ToListAsync();

        return results;
    }

    public async Task<MatchDto> CreateMatchAsync(long currentUserId, CreateMatchDto createMatchDto)
    {
        if (createMatchDto.PickupSeq >= createMatchDto.DropoffSeq)
        {
            throw new ArgumentException("Pickup sequence must be strictly less than dropoff sequence.");
        }

        var request = await _context.RideRequests
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == createMatchDto.RequestId);

        if (request == null)
        {
            throw new ArgumentException($"Ride request with ID {createMatchDto.RequestId} was not found.");
        }

        if (request.UserId != currentUserId)
        {
            throw new UnauthorizedAccessException("You can only create matches for your own ride requests.");
        }

        var advertisement = await _context.Advertisements
            .Include(a => a.Route)
            .ThenInclude(r => r!.User)
            .FirstOrDefaultAsync(a => a.Id == createMatchDto.AdvertisementId);

        if (advertisement == null || advertisement.Route == null)
        {
            throw new ArgumentException($"Advertisement with ID {createMatchDto.AdvertisementId} was not found.");
        }

        var driver = advertisement.Route.User;
        var passenger = request.User;

        if (driver == null || passenger == null)
        {
            throw new InvalidOperationException("Driver or passenger user details could not be found.");
        }

        if (driver.Id == passenger.Id)
        {
            throw new InvalidOperationException("Driver and passenger cannot be the same user.");
        }

        if (driver.OrganizationId != passenger.OrganizationId)
        {
            throw new InvalidOperationException("Matching is only allowed between users from the same organization.");
        }

        var match = new Match
        {
            AdvertisementId = createMatchDto.AdvertisementId,
            RequestId = createMatchDto.RequestId,
            PickupSeq = createMatchDto.PickupSeq,
            DropoffSeq = createMatchDto.DropoffSeq,
            Status = MatchStatus.Pending
        };

        _context.Matches.Add(match);
        await _context.SaveChangesAsync();

        return MapToDto(match);
    }

    public async Task<IEnumerable<MatchDto>> GetMatchesForUserAsync(long currentUserId)
    {
        var matches = await _context.Matches
            .AsNoTracking()
            .Include(m => m.Request)
            .Include(m => m.Advertisement)
            .ThenInclude(a => a!.Route)
            .Where(m => m.Request!.UserId == currentUserId || m.Advertisement!.Route!.UserId == currentUserId)
            .ToListAsync();

        return matches.Select(MapToDto);
    }

    public async Task<MatchDto?> UpdateMatchStatusAsync(long matchId, long currentUserId, MatchStatus status)
    {
        var match = await _context.Matches
            .Include(m => m.Request)
            .Include(m => m.Advertisement)
            .ThenInclude(a => a!.Route)
            .FirstOrDefaultAsync(m => m.Id == matchId);

        if (match == null)
        {
            return null;
        }

        var isPassenger = match.Request?.UserId == currentUserId;
        var isDriver = match.Advertisement?.Route?.UserId == currentUserId;

        if (!isPassenger && !isDriver)
        {
            throw new UnauthorizedAccessException("You do not have permission to update this match.");
        }

        match.Status = status;
        await _context.SaveChangesAsync();

        return MapToDto(match);
    }

    private static MatchDto MapToDto(Match match) => new()
    {
        Id = match.Id,
        AdvertisementId = match.AdvertisementId,
        RequestId = match.RequestId,
        PickupSeq = match.PickupSeq,
        DropoffSeq = match.DropoffSeq,
        Status = match.Status
    };
}
