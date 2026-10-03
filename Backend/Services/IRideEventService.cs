using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IRideEventService
{
    Task<RideEventDto> CreateRideEventAsync(long userId, CreateRideEventDto createDto);
    Task<IEnumerable<RideEventDto>> GetEventsForAdvertisementAsync(long advertisementId, long userId);
    Task<IEnumerable<RideStatusDto>> GetRideStatusAsync(long advertisementId, DateOnly? date);
    Task<PassengerRidingDto> IsPassengerRidingAsync(long matchId, DateOnly date, long userId);
}
