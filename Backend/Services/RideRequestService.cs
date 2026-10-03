using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

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
        var startPoint = new Point(createDto.StartP.Longitude, createDto.StartP.Latitude) { SRID = 4326 };
        var endPoint = new Point(createDto.EndP.Longitude, createDto.EndP.Latitude) { SRID = 4326 };

        var request = new RideRequest
        {
            UserId = userId,
            StartP = startPoint,
            EndP = endPoint,
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

    private static RideRequestDto MapToDto(RideRequest request)
    {
        return new RideRequestDto
        {
            Id = request.Id,
            UserId = request.UserId,
            StartP = new PointDto { Latitude = request.StartP.Y, Longitude = request.StartP.X },
            EndP = new PointDto { Latitude = request.EndP.Y, Longitude = request.EndP.X },
            DepartureTime = request.DepartureTime,
            DaysOfWeek = request.DaysOfWeek,
            IsActive = request.IsActive
        };
    }
}
