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
            .Include(r => r.Points)
            .FirstOrDefaultAsync(r => r.Id == createDto.RouteId && r.UserId == userId);

        if (route == null)
            throw new InvalidOperationException("Route not found or does not belong to the user.");

        var departureTime = createDto.DepartureTime;
        TimeOnly estimatedArrivalTime;

        if (createDto.EstimatedArrivalTime.HasValue)
        {
            estimatedArrivalTime = createDto.EstimatedArrivalTime.Value;
        }
        else if (createDto.EstimatedDurationMinutes.HasValue)
        {
            estimatedArrivalTime = departureTime.AddMinutes(createDto.EstimatedDurationMinutes.Value);
        }
        else
        {
            var durationMinutes = CalculateRouteDurationMinutes(route);
            estimatedArrivalTime = departureTime.AddMinutes(durationMinutes);
        }

        // Check for schedule overlaps with existing active advertisements of this driver
        var existingAds = await _context.Advertisements
            .Include(a => a.Route)
                .ThenInclude(r => r!.Points)
            .Where(a => a.IsActive && a.Route!.UserId == userId)
            .ToListAsync();

        foreach (var existingAd in existingAds)
        {
            if (DoDaysOverlap(existingAd.DaysOfWeek, createDto.DaysOfWeek))
            {
                var existingEstimatedArrival = existingAd.EstimatedArrivalTime != default
                    ? existingAd.EstimatedArrivalTime
                    : existingAd.DepartureTime.AddMinutes(CalculateRouteDurationMinutes(existingAd.Route!));

                if (DoTimeRangesOverlap(departureTime, estimatedArrivalTime, existingAd.DepartureTime, existingEstimatedArrival))
                {
                    throw new InvalidOperationException(
                        $"Driver already has a route scheduled during this time window ({existingAd.DepartureTime:HH:mm} - {existingEstimatedArrival:HH:mm}).");
                }
            }
        }

        var advertisement = new Advertisement
        {
            RouteId = createDto.RouteId,
            UsersCarId = createDto.UsersCarId,
            Seats = createDto.Seats,
            DepartureTime = createDto.DepartureTime,
            EstimatedArrivalTime = estimatedArrivalTime,
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

    public static int CalculateRouteDurationMinutes(RouteModel? route)
    {
        if (route?.Points == null || route.Points.Count < 2)
        {
            return 30; // default 30 minutes if route points are unspecified or fewer than 2
        }

        var sortedPoints = route.Points.OrderBy(p => p.Seq).ToList();
        double totalDistanceKm = 0;

        for (int i = 0; i < sortedPoints.Count - 1; i++)
        {
            var p1 = sortedPoints[i].Point;
            var p2 = sortedPoints[i + 1].Point;
            totalDistanceKm += HaversineDistanceKm(p1.Y, p1.X, p2.Y, p2.X);
        }

        // Average driving speed ~50 km/h
        double durationHours = totalDistanceKm / 50.0;
        int durationMinutes = (int)Math.Round(durationHours * 60.0);
        return Math.Max(15, durationMinutes);
    }

    public static bool DoDaysOverlap(Weekday[]? days1, Weekday[]? days2)
    {
        if (days1 == null || days1.Length == 0 || days2 == null || days2.Length == 0)
        {
            return true;
        }
        return days1.Intersect(days2).Any();
    }

    public static bool DoTimeRangesOverlap(TimeOnly start1, TimeOnly end1, TimeOnly start2, TimeOnly end2)
    {
        int s1 = start1.Hour * 60 + start1.Minute;
        int e1 = end1.Hour * 60 + end1.Minute;
        if (e1 <= s1) e1 += 1440;

        int s2 = start2.Hour * 60 + start2.Minute;
        int e2 = end2.Hour * 60 + end2.Minute;
        if (e2 <= s2) e2 += 1440;

        return IntervalsOverlap(s1, e1, s2, e2) ||
               IntervalsOverlap(s1, e1, s2 + 1440, e2 + 1440) ||
               IntervalsOverlap(s1 + 1440, e1 + 1440, s2, e2);
    }

    private static bool IntervalsOverlap(int s1, int e1, int s2, int e2)
    {
        return Math.Max(s1, s2) < Math.Min(e1, e2);
    }

    private static double HaversineDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double r = 6371.0;
        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return r * c;
    }

    private static double ToRadians(double degrees) => degrees * (Math.PI / 180.0);

    private static AdvertisementDto MapToDto(Advertisement advertisement)
    {
        return new AdvertisementDto
        {
            Id = advertisement.Id,
            RouteId = advertisement.RouteId,
            UsersCarId = advertisement.UsersCarId,
            Seats = advertisement.Seats,
            DepartureTime = advertisement.DepartureTime,
            EstimatedArrivalTime = advertisement.EstimatedArrivalTime,
            DaysOfWeek = advertisement.DaysOfWeek,
            IsRecurring = advertisement.IsRecurring,
            IsActive = advertisement.IsActive,
            Description = advertisement.Description
        };
    }
}
