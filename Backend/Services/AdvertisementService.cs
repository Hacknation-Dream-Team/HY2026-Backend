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
        var route = await _context.Routes
            .FirstOrDefaultAsync(r => r.Id == createDto.RouteId && r.UserId == userId);

        if (route == null)
            throw new InvalidOperationException("Route not found or does not belong to the user.");

        if (createDto.UsersCarId.HasValue)
        {
            var userCar = await _context.UserCars
                .FirstOrDefaultAsync(uc => uc.Id == createDto.UsersCarId.Value && uc.UserId == userId);

            if (userCar == null)
            {
                throw new InvalidOperationException("Specified car was not found or does not belong to the user.");
            }

            if (createDto.Seats > userCar.PassengerSeats)
            {
                throw new InvalidOperationException($"Seats ({createDto.Seats}) cannot exceed the car's passenger seats ({userCar.PassengerSeats}).");
            }
        }

        if (createDto.Seats <= 0)
        {
            throw new InvalidOperationException("Seats must be greater than 0.");
        }

        // Check for schedule overlaps with existing active advertisements of this driver on the same direction/route
        var existingAds = await _context.Advertisements
            .Include(a => a.Route)
            .Where(a => a.IsActive && a.Route!.UserId == userId && a.Route.Direction == route.Direction)
            .ToListAsync();

        foreach (var existingAd in existingAds)
        {
            if (DoDaysOverlap(existingAd.DaysOfWeek, createDto.DaysOfWeek) && existingAd.DepartureTime == createDto.DepartureTime)
            {
                throw new InvalidOperationException(
                    $"Driver already has an active advertisement for this direction at {existingAd.DepartureTime:HH:mm}.");
            }
        }

        var advertisement = new Advertisement
        {
            RouteId = createDto.RouteId,
            UsersCarId = createDto.UsersCarId,
            Seats = createDto.Seats,
            DepartureTime = createDto.DepartureTime,
            DaysOfWeek = createDto.DaysOfWeek,
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

    public static bool DoDaysOverlap(Weekday[]? days1, Weekday[]? days2)
    {
        if (days1 == null || days1.Length == 0 || days2 == null || days2.Length == 0)
        {
            return true;
        }
        return days1.Intersect(days2).Any();
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
            IsActive = advertisement.IsActive,
            Description = advertisement.Description
        };
    }
}
