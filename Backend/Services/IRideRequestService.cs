using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IRideRequestService
{
    Task<RideRequestDto> CreateRideRequestAsync(long userId, CreateRideRequestDto createDto);
    Task<IEnumerable<RideRequestDto>> GetRideRequestsAsync(long userId);
    Task<RideRequestDto?> GetRideRequestAsync(long id, long userId);
    Task<bool> DeleteRideRequestAsync(long id, long userId);
}
