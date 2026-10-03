using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IRideEventService
{
    Task<RideEventDto> CreateRideEventAsync(long userId, CreateRideEventDto createDto);
    Task<IEnumerable<RideEventDto>> GetEventsForAdvertisementAsync(long advertisementId, long userId);
}
