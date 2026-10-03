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
