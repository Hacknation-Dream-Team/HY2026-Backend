using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Services;

public class RideRequestService : IRideRequestService
{
    private readonly AppDbContext _context;

    public RideRequestService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RideRequestDto> CreateRideRequestAsync(long userId, CreateRideRequestDto createDto)
    {
        var request = new RideRequest
        {
            UserId = userId,
            Direction = createDto.Direction,
            DepartureTime = createDto.DepartureTime,
            DaysOfWeek = createDto.DaysOfWeek,
            IsActive = true
        };

        _context.RideRequests.Add(request);
        await _context.SaveChangesAsync();

        return MapToDto(request);
    }

    public async Task<IEnumerable<RideRequestDto>> GetRideRequestsAsync(long userId)
    {
        var requests = await _context.RideRequests
            .Where(r => r.UserId == userId)
            .ToListAsync();

        return requests.Select(MapToDto);
    }

    public async Task<RideRequestDto?> GetRideRequestAsync(long id, long userId)
    {
        var request = await _context.RideRequests
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (request == null) return null;

        return MapToDto(request);
    }

    public async Task<bool> DeleteRideRequestAsync(long id, long userId)
    {
        var request = await _context.RideRequests
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (request == null) return false;

        _context.RideRequests.Remove(request);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<RideRequestDto?> UpdateRideRequestAsync(long id, long userId, UpdateRideRequestDto updateDto)
    {
        var request = await _context.RideRequests
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (request == null) return null;

        request.DepartureTime = updateDto.DepartureTime;
        request.DaysOfWeek = updateDto.DaysOfWeek;

        await _context.SaveChangesAsync();
        return MapToDto(request);
    }

    private static RideRequestDto MapToDto(RideRequest request)
    {
        return new RideRequestDto
        {
            Id = request.Id,
            UserId = request.UserId,
            Direction = request.Direction,
            DepartureTime = request.DepartureTime,
            DaysOfWeek = request.DaysOfWeek,
            IsActive = request.IsActive
        };
    }
}
