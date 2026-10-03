using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IAdminService
{
    Task<SystemStatsDto> GetSystemStatsAsync();
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<IEnumerable<OrganizationDto>> GetAllOrganizationsAsync();
    Task<IEnumerable<RouteDto>> GetAllRoutesAsync();
    Task<IEnumerable<AdvertisementDto>> GetAllAdvertisementsAsync();
    Task<IEnumerable<RideRequestDto>> GetAllRideRequestsAsync();
    Task<IEnumerable<MatchDto>> GetAllMatchesAsync();
    Task<IEnumerable<RideDto>> GetAllRidesAsync();
}
