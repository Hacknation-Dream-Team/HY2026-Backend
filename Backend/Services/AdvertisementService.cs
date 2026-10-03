using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Services;

public class AdvertisementService : IAdvertisementService
{
    private readonly AppDbContext _context;

    public AdvertisementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AdvertisementDto> CreateAdvertisementAsync(long userId, CreateAdvertisementDto createDto)
    {
        // verify route belongs to user
        var route = await _context.Routes.FirstOrDefaultAsync(r => r.Id == createDto.RouteId && r.UserId == userId);
        if (route == null)
            throw new InvalidOperationException("Route not found or does not belong to the user.");

        var advertisement = new Advertisement
        {
            RouteId = createDto.RouteId,
            UsersCarId = createDto.UsersCarId,
            Seats = createDto.Seats,
            DepartureTime = createDto.DepartureTime,
            DaysOfWeek = createDto.DaysOfWeek,
            IsRecurring = createDto.IsRecurring,
            IsActive = true,
            Description = createDto.Description
        };

        _context.Advertisements.Add(advertisement);
        await _context.SaveChangesAsync();

        return MapToDto(advertisement);
    }

    public async Task<IEnumerable<AdvertisementDto>> GetAdvertisementsAsync(long userId)
    {
        var advertisements = await _context.Advertisements
            .Include(a => a.Route)
            .Where(a => a.Route!.UserId == userId)
            .ToListAsync();

        return advertisements.Select(MapToDto);
    }

    public async Task<AdvertisementDto?> GetAdvertisementAsync(long id, long userId)
    {
        var advertisement = await _context.Advertisements
            .Include(a => a.Route)
            .FirstOrDefaultAsync(a => a.Id == id && a.Route!.UserId == userId);

        if (advertisement == null) return null;

        return MapToDto(advertisement);
    }

    public async Task<bool> DeleteAdvertisementAsync(long id, long userId)
    {
        var advertisement = await _context.Advertisements
            .Include(a => a.Route)
            .FirstOrDefaultAsync(a => a.Id == id && a.Route!.UserId == userId);

        if (advertisement == null) return false;

        _context.Advertisements.Remove(advertisement);
        await _context.SaveChangesAsync();

        return true;
    }

    private static AdvertisementDto MapToDto(Advertisement advertisement)
    {
        return new AdvertisementDto
        {
            Id = advertisement.Id,
            RouteId = advertisement.RouteId,
            UsersCarId = advertisement.UsersCarId,
            Seats = advertisement.Seats,
            DepartureTime = advertisement.DepartureTime,
            DaysOfWeek = advertisement.DaysOfWeek,
            IsRecurring = advertisement.IsRecurring,
            IsActive = advertisement.IsActive,
            Description = advertisement.Description
        };
    }
}
