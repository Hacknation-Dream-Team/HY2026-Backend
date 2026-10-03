using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Services;

public class RideService : IRideService
{
    private readonly AppDbContext _context;

    public RideService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RideDto> CreateRideAsync(CreateRideDto createDto, long userId)
    {
        var match = await _context.Matches
            .Include(m => m.Advertisement)
                .ThenInclude(a => a!.Route)
            .Include(m => m.Request)
            .FirstOrDefaultAsync(m => m.Id == createDto.MatchId);

        if (match == null)
            throw new InvalidOperationException("Match not found.");

        if (match.Advertisement!.Route!.UserId != userId && match.Request!.UserId != userId)
            throw new InvalidOperationException("User is not part of this match.");

        var ride = new Ride
        {
            MatchId = createDto.MatchId,
            RideDate = createDto.RideDate
        };

        _context.Rides.Add(ride);
        await _context.SaveChangesAsync();

        return new RideDto
        {
            Id = ride.Id,
            MatchId = ride.MatchId,
            RideDate = ride.RideDate
        };
    }

    public async Task<IEnumerable<RideDto>> GetMyRidesAsync(long userId)
    {
        var rides = await _context.Rides
            .Include(r => r.Match)
                .ThenInclude(m => m!.Advertisement)
                    .ThenInclude(a => a!.Route)
            .Include(r => r.Match)
                .ThenInclude(m => m!.Request)
            .Where(r => r.Match!.Advertisement!.Route!.UserId == userId || r.Match!.Request!.UserId == userId)
            .ToListAsync();

        return rides.Select(r => new RideDto
        {
            Id = r.Id,
            MatchId = r.MatchId,
            RideDate = r.RideDate
        });
    }
}
