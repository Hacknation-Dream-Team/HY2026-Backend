using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Helpers;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;

    public AdminService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SystemStatsDto> GetSystemStatsAsync()
    {
        return new SystemStatsDto
        {
            TotalUsers = await _context.Users.CountAsync(),
            TotalAdmins = await _context.Users.CountAsync(u => u.Role == UserRoles.Admin),
            TotalOrganizations = await _context.Organizations.CountAsync(),
            TotalRoutes = await _context.Routes.CountAsync(),
            TotalAdvertisements = await _context.Advertisements.CountAsync(),
            TotalRideRequests = await _context.RideRequests.CountAsync(),
            TotalMatches = await _context.Matches.CountAsync(),
            TotalRideEvents = await _context.RideEvents.CountAsync(),
            TotalCarModels = await _context.CarModels.CountAsync()
        };
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _context.Users.AsNoTracking().ToListAsync();
        return users.Select(u => new UserDto
        {
            Id = u.Id,
            OrganizationId = u.OrganizationId,
            Name = u.Name,
            Surname = u.Surname,
            Email = u.Email,
            Role = string.IsNullOrWhiteSpace(u.Role) ? UserRoles.User : u.Role,
            Phone = u.Phone,
            Gender = u.Gender,
            ProfileImg = u.ProfileImg,
            HomeAddress = u.HomeAddress,
            HomeLocation = u.HomeLocation == null ? null : new PointDto { Latitude = u.HomeLocation.Y, Longitude = u.HomeLocation.X }
        });
    }

    public async Task<IEnumerable<OrganizationDto>> GetAllOrganizationsAsync()
    {
        var orgs = await _context.Organizations.AsNoTracking().ToListAsync();
        return orgs.Select(o => new OrganizationDto
        {
            Id = o.Id,
            Name = o.Name,
            Address = o.Address,
            Location = new PointDto { Latitude = o.Location.Y, Longitude = o.Location.X }
        });
    }

    public async Task<IEnumerable<RouteDto>> GetAllRoutesAsync()
    {
        var routes = await _context.Routes
            .AsNoTracking()
            .Include(r => r.Points)
            .ToListAsync();

        return routes.Select(r => new RouteDto
        {
            Id = r.Id,
            UserId = r.UserId,
            Direction = r.Direction,
            Points = r.Points.OrderBy(p => p.Seq).Select(p => new PointDto
            {
                Latitude = p.Point.Y,
                Longitude = p.Point.X
            }).ToList()
        });
    }

    public async Task<IEnumerable<AdvertisementDto>> GetAllAdvertisementsAsync()
    {
        var ads = await _context.Advertisements.AsNoTracking().ToListAsync();
        return ads.Select(a => new AdvertisementDto
        {
            Id = a.Id,
            RouteId = a.RouteId,
            UsersCarId = a.UsersCarId,
            Seats = a.Seats,
            DepartureTime = a.DepartureTime,
            DaysOfWeek = a.DaysOfWeek,
            IsActive = a.IsActive,
            Description = a.Description
        });
    }

    public async Task<IEnumerable<RideRequestDto>> GetAllRideRequestsAsync()
    {
        var requests = await _context.RideRequests.AsNoTracking().ToListAsync();
        return requests.Select(r => new RideRequestDto
        {
            Id = r.Id,
            UserId = r.UserId,
            Direction = r.Direction,
            DepartureTime = r.DepartureTime,
            DaysOfWeek = r.DaysOfWeek,
            IsActive = r.IsActive
        });
    }

    public async Task<IEnumerable<MatchDto>> GetAllMatchesAsync()
    {
        var matches = await _context.Matches.AsNoTracking().ToListAsync();
        return matches.Select(m => new MatchDto
        {
            Id = m.Id,
            AdvertisementId = m.AdvertisementId,
            RequestId = m.RequestId,
            PickupSeq = m.PickupSeq,
            DropoffSeq = m.DropoffSeq,
            Status = m.Status
        });
    }

    public async Task<IEnumerable<RideEventDto>> GetAllRideEventsAsync()
    {
        var events = await _context.RideEvents.AsNoTracking().ToListAsync();
        return events.Select(e => new RideEventDto
        {
            Id = e.Id,
            AdvertisementId = e.AdvertisementId,
            MatchId = e.MatchId,
            RideDate = e.RideDate,
            Event = e.Event,
            CreatedBy = e.CreatedBy,
            CreatedAt = e.CreatedAt
        });
    }
}
