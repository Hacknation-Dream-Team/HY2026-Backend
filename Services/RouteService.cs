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
        var startPoint = new Point(createRouteDto.StartP.Longitude, createRouteDto.StartP.Latitude) { SRID = 4326 };
        var endPoint = new Point(createRouteDto.EndP.Longitude, createRouteDto.EndP.Latitude) { SRID = 4326 };

        var route = new RouteModel
        {
            UserId = userId,
            StartP = startPoint,
            EndP = endPoint,
            LookingFor = createRouteDto.LookingFor
        };

        _context.Routes.Add(route);
        await _context.SaveChangesAsync();

        return MapToDto(route);
    }

    public async Task<RouteDto?> GetRouteByIdAsync(long id)
    {
        var route = await _context.Routes
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id);

        return route == null ? null : MapToDto(route);
    }

    public async Task<IEnumerable<RouteDto>> GetAllRoutesAsync(long? userId = null)
    {
        var query = _context.Routes.AsNoTracking();

        if (userId.HasValue)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        var routes = await query.ToListAsync();
        return routes.Select(MapToDto);
    }

    public async Task<bool> DeleteRouteAsync(long id, long userId)
    {
        var route = await _context.Routes.FindAsync(id);
        if (route == null)
        {
            return false;
        }

        if (route.UserId != userId)
        {
            throw new UnauthorizedAccessException("You do not have permission to delete this route.");
        }

        _context.Routes.Remove(route);
        await _context.SaveChangesAsync();
        return true;
    }

    private static RouteDto MapToDto(RouteModel route) => new()
    {
        Id = route.Id,
        UserId = route.UserId,
        StartP = new PointDto
        {
            Latitude = route.StartP.Y,
            Longitude = route.StartP.X
        },
        EndP = new PointDto
        {
            Latitude = route.EndP.Y,
            Longitude = route.EndP.X
        },
        LookingFor = route.LookingFor
    };
}
