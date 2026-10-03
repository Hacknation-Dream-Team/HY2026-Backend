using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace HY2026_Backend.Services;

public class RouteService : IRouteService
{
    private readonly AppDbContext _context;

    public RouteService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RouteDto> CreateRouteAsync(long userId, CreateRouteDto createRouteDto)
    {
        var existingRoute = await _context.Routes
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Direction == createRouteDto.Direction);

        if (existingRoute != null)
        {
            throw new InvalidOperationException($"Driver already has a route for direction '{createRouteDto.Direction}'.");
        }

        var intermediatePoints = createRouteDto.GetIntermediatePoints();

        var route = new RouteModel
        {
            UserId = userId,
            Direction = createRouteDto.Direction
        };

        _context.Routes.Add(route);
        await _context.SaveChangesAsync();

        short seq = 1;
        foreach (var pointDto in intermediatePoints)
        {
            var point = new Point(pointDto.Longitude, pointDto.Latitude) { SRID = 4326 };
            _context.RoutePoints.Add(new RoutePoint
            {
                RouteId = route.Id,
                Seq = seq++,
                Point = point
            });
        }

        await _context.SaveChangesAsync();

        var result = await GetRouteByIdAsync(route.Id)
            ?? throw new InvalidOperationException("Failed to retrieve created route.");
        result.LookingFor = createRouteDto.LookingFor;
        return result;
    }

    public async Task<RouteDto?> GetRouteByIdAsync(long id)
    {
        var route = await _context.Routes
            .AsNoTracking()
            .Include(r => r.Points)
            .FirstOrDefaultAsync(r => r.Id == id);

        return route == null ? null : MapToDto(route);
    }

    public async Task<IEnumerable<RouteDto>> GetAllRoutesAsync(long? userId = null)
    {
        var query = _context.Routes
            .AsNoTracking()
            .Include(r => r.Points)
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        var routes = await query.ToListAsync();
        return routes.Select(MapToDto);
    }

    public async Task<bool> DeleteRouteAsync(long id, long userId)
    {
        var route = await _context.Routes
            .Include(r => r.Points)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (route == null)
        {
            return false;
        }

        if (route.UserId != userId)
        {
            throw new UnauthorizedAccessException("You do not have permission to delete this route.");
        }

        _context.RoutePoints.RemoveRange(route.Points);
        _context.Routes.Remove(route);
        await _context.SaveChangesAsync();
        return true;
    }

    private static RouteDto MapToDto(RouteModel route)
    {
        var points = route.Points
            .OrderBy(p => p.Seq)
            .Select(p => new PointDto
            {
                Latitude = p.Point.Y,
                Longitude = p.Point.X
            })
            .ToList();

        return new RouteDto
        {
            Id = route.Id,
            UserId = route.UserId,
            Direction = route.Direction,
            Points = points,
            LookingFor = null
        };
    }
}
