using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IRideService
{
    Task<RideDto> CreateRideAsync(CreateRideDto createDto, long userId);
    Task<IEnumerable<RideDto>> GetMyRidesAsync(long userId);
}
