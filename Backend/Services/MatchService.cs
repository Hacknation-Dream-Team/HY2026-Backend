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
        RideRequest? targetRequest;

        if (requestId.HasValue && requestId.Value > 0)
        {
            targetRequest = await _context.RideRequests
                .AsNoTracking()
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == requestId.Value);

            if (targetRequest == null)
            {
                throw new InvalidOperationException($"Ride request with ID {requestId.Value} was not found.");
            }

            if (targetRequest.UserId != currentUserId)
            {
                throw new InvalidOperationException("You can only search matches for your own ride requests.");
            }
        }
        else
        {
            targetRequest = await _context.RideRequests
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => r.UserId == currentUserId && r.IsActive)
                .OrderByDescending(r => r.Id)
                .FirstOrDefaultAsync();

            if (targetRequest == null)
            {
                throw new InvalidOperationException("No active ride request was found for the current user.");
            }
        }

        if (targetRequest.User?.HomeLocation == null)
        {
            throw new InvalidOperationException("Set your home address before searching for matches; without it you will not get any matches.");
        }

        var targetRequestId = targetRequest.Id;

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

        // Defensive direction check: the ad's route direction must equal the request direction.
        var adIds = results.Select(r => r.AdvertisementId).Distinct().ToList();
        var validAdIds = await _context.Advertisements
            .AsNoTracking()
            .Where(a => adIds.Contains(a.Id) && a.Route!.Direction == targetRequest.Direction)
            .Select(a => a.Id)
            .ToListAsync();

        return results.Where(r => validAdIds.Contains(r.AdvertisementId)).ToList();
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

        if (passenger.HomeLocation == null)
        {
            throw new InvalidOperationException("Set your home address before creating matches.");
        }

        if (advertisement.Route.Direction != request.Direction)
        {
            throw new InvalidOperationException("Route direction does not match the ride request direction.");
        }

        if (!advertisement.IsActive || !request.IsActive)
        {
            throw new InvalidOperationException("Advertisement and ride request must both be active.");
        }

        var stopSeqs = await _context.RouteStops
            .AsNoTracking()
            .Where(s => s.RouteId == advertisement.RouteId)
            .Select(s => s.Seq)
            .ToListAsync();

        if (!stopSeqs.Contains(createMatchDto.PickupSeq) || !stopSeqs.Contains(createMatchDto.DropoffSeq))
        {
            throw new ArgumentException("Pickup and dropoff sequence must exist in the route stops of this advertisement.");
        }

        var duplicate = await _context.Matches.AnyAsync(m =>
            m.AdvertisementId == createMatchDto.AdvertisementId &&
            m.RequestId == createMatchDto.RequestId &&
            m.Status != MatchStatus.Cancelled && m.Status != MatchStatus.Rejected);
        if (duplicate)
        {
            throw new InvalidOperationException("A match for this advertisement and request already exists.");
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
                .ThenInclude(r => r!.User)
            .Include(m => m.Advertisement)
                .ThenInclude(a => a!.Route)
                    .ThenInclude(r => r!.User)
            .Where(m => m.Request!.UserId == currentUserId || m.Advertisement!.Route!.UserId == currentUserId)
            .ToListAsync();

        return matches.Select(MapToDto);
    }

    public async Task<MatchDto?> UpdateMatchStatusAsync(long matchId, long currentUserId, MatchStatus status)
    {
        var match = await _context.Matches
            .Include(m => m.Request)
                .ThenInclude(r => r!.User)
            .Include(m => m.Advertisement)
                .ThenInclude(a => a!.Route)
                    .ThenInclude(r => r!.User)
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

        if (status == MatchStatus.Pending)
        {
            throw new InvalidOperationException("Status cannot be set back to pending.");
        }

        if (match.Status == MatchStatus.Cancelled)
        {
            throw new InvalidOperationException("A cancelled match can no longer be changed.");
        }

        if (match.Status == MatchStatus.Rejected)
        {
            throw new InvalidOperationException("A rejected match can no longer be changed.");
        }

        if (!isDriver && status != MatchStatus.Cancelled)
        {
            throw new UnauthorizedAccessException("Only the driver can accept or reject a match; a passenger can only cancel it.");
        }

        if (status == MatchStatus.Accepted && match.Status != MatchStatus.Accepted)
        {
            var seats = match.Advertisement!.Seats;
            var accepted = await _context.Matches.CountAsync(m =>
                m.AdvertisementId == match.AdvertisementId &&
                m.Status == MatchStatus.Accepted && m.Id != match.Id);
            if (accepted >= seats)
            {
                throw new InvalidOperationException($"Cannot accept: all {seats} seat(s) of this advertisement are already taken.");
            }
        }

        match.Status = status;
        await _context.SaveChangesAsync();

        return MapToDto(match);
    }

    private static MatchDto MapToDto(Match match)
    {
        var driverUser = match.Advertisement?.Route?.User;
        var passengerUser = match.Request?.User;
        var route = match.Advertisement?.Route;

        return new MatchDto
        {
            Id = match.Id,
            AdvertisementId = match.AdvertisementId,
            RequestId = match.RequestId,
            PickupSeq = match.PickupSeq,
            DropoffSeq = match.DropoffSeq,
            Status = match.Status,
            DriverUserId = driverUser?.Id ?? match.Advertisement?.Route?.UserId ?? 0,
            PassengerUserId = passengerUser?.Id ?? match.Request?.UserId ?? 0,
            DriverName = driverUser != null ? $"{driverUser.Name} {driverUser.Surname}".Trim() : null,
            PassengerName = passengerUser != null ? $"{passengerUser.Name} {passengerUser.Surname}".Trim() : null,
            Direction = route != null ? route.Direction.ToString() : null,
            DepartureTime = match.Advertisement?.DepartureTime.ToString() ?? match.Request?.DepartureTime.ToString()
        };
    }
}
