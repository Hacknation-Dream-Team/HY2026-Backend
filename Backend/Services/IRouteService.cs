using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IRouteService
{
    Task<RouteDto> CreateRouteAsync(long userId, CreateRouteDto createRouteDto);
    Task<RouteDto?> GetRouteByIdAsync(long id);
    Task<IEnumerable<RouteDto>> GetAllRoutesAsync(long? userId = null);
    Task<bool> DeleteRouteAsync(long id, long userId);
    Task<IEnumerable<RouteStopDto>?> GetRouteStopsAsync(long routeId);
}
