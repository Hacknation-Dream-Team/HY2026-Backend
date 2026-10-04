using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Services;

public class RideEventService : IRideEventService
{
    private readonly AppDbContext _context;

    public RideEventService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RideEventDto> CreateRideEventAsync(long userId, CreateRideEventDto createDto)
    {
        var ad = await _context.Advertisements
            .Include(a => a.Route)
            .FirstOrDefaultAsync(a => a.Id == createDto.AdvertisementId);

        if (ad == null)
        {
            throw new ArgumentException("Advertisement not found.");
        }

        var weekday = ToWeekday(createDto.RideDate);
        if (!ad.DaysOfWeek.Contains(weekday))
        {
            throw new ArgumentException($"Ride date {createDto.RideDate:yyyy-MM-dd} ({weekday}) is not one of the advertisement's days of week.");
        }

        if (createDto.MatchId.HasValue)
        {
            var match = await _context.Matches
                .Include(m => m.Request)
                .FirstOrDefaultAsync(m => m.Id == createDto.MatchId.Value);

            if (match == null || match.AdvertisementId != createDto.AdvertisementId)
            {
                throw new ArgumentException("Specified match does not belong to this advertisement.");
            }

            // Only passenger of the match or driver of the advertisement can log an event for the match
            if (match.Request?.UserId != userId && ad.Route?.UserId != userId)
            {
                throw new UnauthorizedAccessException("You are not authorized to modify this match schedule.");
            }
        }
        else
        {
            // Cancelling/restoring the whole ride requires driver permission
            if (ad.Route?.UserId != userId)
            {
                throw new UnauthorizedAccessException("Only the driver can cancel/restore the entire ride for a date.");
            }
        }

        var rideEvent = new RideEvent
        {
            AdvertisementId = createDto.AdvertisementId,
            MatchId = createDto.MatchId,
            RideDate = createDto.RideDate,
            Event = createDto.Event,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.RideEvents.Add(rideEvent);
        await _context.SaveChangesAsync();

        return MapToDto(rideEvent);
    }

    public async Task<IEnumerable<RideEventDto>> GetEventsForAdvertisementAsync(long advertisementId, long userId)
    {
        var events = await _context.RideEvents
            .Where(e => e.AdvertisementId == advertisementId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return events.Select(MapToDto);
    }

    public async Task<IEnumerable<RideStatusDto>> GetRideStatusAsync(long advertisementId, DateOnly? date)
    {
        var query = _context.RideStatuses.AsNoTracking().Where(s => s.AdvertisementId == advertisementId);
        if (date.HasValue)
        {
            query = query.Where(s => s.RideDate == date.Value);
        }

        var rows = await query.OrderBy(s => s.RideDate).ToListAsync();
        return rows.Select(s => new RideStatusDto
        {
            AdvertisementId = s.AdvertisementId,
            MatchId = s.MatchId,
            RideDate = s.RideDate,
            Event = s.Event,
            CreatedBy = s.CreatedBy,
            CreatedAt = s.CreatedAt
        });
    }

    public async Task<PassengerRidingDto> IsPassengerRidingAsync(long matchId, DateOnly date, long userId)
    {
        var match = await _context.Matches
            .AsNoTracking()
            .Include(m => m.Request)
            .Include(m => m.Advertisement)
            .ThenInclude(a => a!.Route)
            .FirstOrDefaultAsync(m => m.Id == matchId);

        if (match == null || match.Advertisement == null)
        {
            throw new ArgumentException($"Match with ID {matchId} was not found.");
        }

        if (match.Request?.UserId != userId && match.Advertisement.Route?.UserId != userId)
        {
            throw new UnauthorizedAccessException("You are not a participant of this match.");
        }

        var result = new PassengerRidingDto
        {
            MatchId = matchId,
            AdvertisementId = match.AdvertisementId,
            RideDate = date
        };

        if (match.Status != MatchStatus.Accepted)
        {
            result.Reason = $"Match status is {match.Status}.";
            return result;
        }

        if (!match.Advertisement.IsActive || !match.Advertisement.DaysOfWeek.Contains(ToWeekday(date)))
        {
            result.Reason = "The advertisement does not run on this day.";
            return result;
        }

        var cancelled = await _context.RideStatuses.AsNoTracking().AnyAsync(s =>
            s.AdvertisementId == match.AdvertisementId &&
            s.RideDate == date &&
            s.Event == RideEventType.Cancelled &&
            (s.MatchId == null || s.MatchId == matchId));

        result.IsRiding = !cancelled;
        if (cancelled)
        {
            result.Reason = "The ride was cancelled for this day.";
        }
        return result;
    }

    private static Weekday ToWeekday(DateOnly date) => date.DayOfWeek switch
    {
        DayOfWeek.Monday => Weekday.Mon,
        DayOfWeek.Tuesday => Weekday.Tue,
        DayOfWeek.Wednesday => Weekday.Wed,
        DayOfWeek.Thursday => Weekday.Thu,
        DayOfWeek.Friday => Weekday.Fri,
        DayOfWeek.Saturday => Weekday.Sat,
        _ => Weekday.Sun
    };

    private static RideEventDto MapToDto(RideEvent e) => new()
    {
        Id = e.Id,
        AdvertisementId = e.AdvertisementId,
        MatchId = e.MatchId,
        RideDate = e.RideDate,
        Event = e.Event,
        CreatedBy = e.CreatedBy,
        CreatedAt = e.CreatedAt
    };
}
