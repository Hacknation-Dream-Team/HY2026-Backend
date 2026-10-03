using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace HY2026_Backend.Services;

public class OrganizationService : IOrganizationService
{
    private readonly AppDbContext _context;

    public OrganizationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationDto createDto)
    {
        var location = new Point(createDto.Location.Longitude, createDto.Location.Latitude) { SRID = 4326 };

        var organization = new Organization
        {
            Name = createDto.Name,
            Location = location
        };

        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();

        return MapToDto(organization);
    }

    public async Task<IEnumerable<OrganizationDto>> GetAllOrganizationsAsync()
    {
        var organizations = await _context.Organizations.ToListAsync();
        return organizations.Select(MapToDto);
    }

    public async Task<OrganizationDto?> GetOrganizationAsync(long id)
    {
        var organization = await _context.Organizations.FindAsync(id);
        if (organization == null) return null;

        return MapToDto(organization);
    }

    private static OrganizationDto MapToDto(Organization organization)
    {
        return new OrganizationDto
        {
            Id = organization.Id,
            Name = organization.Name,
            Location = new PointDto { Latitude = organization.Location.Y, Longitude = organization.Location.X }
        };
    }
}
