using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IOrganizationService
{
    Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationDto createDto);
    Task<IEnumerable<OrganizationDto>> GetAllOrganizationsAsync();
    Task<OrganizationDto?> GetOrganizationAsync(long id);
}
