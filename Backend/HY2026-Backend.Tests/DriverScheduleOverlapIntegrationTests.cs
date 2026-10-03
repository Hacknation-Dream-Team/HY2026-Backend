using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HY2026_Backend.Tests;

public class DriverScheduleOverlapIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public DriverScheduleOverlapIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateAdvertisement_OverlappingTimeForSameDriver_FailsWithBadRequest()
    {
        var client = _factory.CreateClient();
        var emailDriver1 = $"driver1.{Guid.NewGuid():N}@example.com";
        var emailDriver2 = $"driver2.{Guid.NewGuid():N}@example.com";

        // Register Driver 1
        var regDriver1 = await client.PostAsJsonAsync("/api/users", new CreateUserDto
        {
            Name = "Driver",
            Surname = "One",
            Email = emailDriver1,
            Password = "Password123!"
        });
        var authDriver1 = await regDriver1.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authDriver1);

        var clientDriver1 = _factory.CreateClient();
        clientDriver1.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authDriver1.Token);

        // Create Route for Driver 1
        var routeRes1 = await clientDriver1.PostAsJsonAsync("/api/routes", new CreateRouteDto
        {
            Direction = TripDirection.ToWork,
            MiddlePoints = new List<PointDto>
            {
                new PointDto { Latitude = 52.1800, Longitude = 21.0200 }
            }
        });
        var route1 = await routeRes1.Content.ReadFromJsonAsync<RouteDto>();
        Assert.NotNull(route1);

        // 1. Create first advertisement (08:00 on Monday)
        var adDto1 = new CreateAdvertisementDto
        {
            RouteId = route1.Id,
            Seats = 3,
            DepartureTime = new TimeOnly(8, 0),
            DaysOfWeek = new[] { Weekday.Mon }
        };

        var adRes1 = await clientDriver1.PostAsJsonAsync("/api/advertisements", adDto1);
        Assert.Equal(HttpStatusCode.Created, adRes1.StatusCode);

        // 2. Attempt to create duplicate advertisement for Driver 1 at 08:00 on Monday -> SHOULD FAIL
        var adDtoOverlap = new CreateAdvertisementDto
        {
            RouteId = route1.Id,
            Seats = 3,
            DepartureTime = new TimeOnly(8, 0),
            DaysOfWeek = new[] { Weekday.Mon }
        };

        var adResOverlap = await clientDriver1.PostAsJsonAsync("/api/advertisements", adDtoOverlap);
        Assert.Equal(HttpStatusCode.BadRequest, adResOverlap.StatusCode);

        // 3. Create non-overlapping advertisement for Driver 1 (10:00 on Monday) -> SHOULD SUCCEED
        var adDtoNonOverlapTime = new CreateAdvertisementDto
        {
            RouteId = route1.Id,
            Seats = 3,
            DepartureTime = new TimeOnly(10, 0),
            DaysOfWeek = new[] { Weekday.Mon }
        };

        var adResNonOverlapTime = await clientDriver1.PostAsJsonAsync("/api/advertisements", adDtoNonOverlapTime);
        Assert.Equal(HttpStatusCode.Created, adResNonOverlapTime.StatusCode);

        // 4. Create advertisement for Driver 1 on a different day (08:00 on Tuesday) -> SHOULD SUCCEED
        var adDtoNonOverlapDay = new CreateAdvertisementDto
        {
            RouteId = route1.Id,
            Seats = 3,
            DepartureTime = new TimeOnly(8, 0),
            DaysOfWeek = new[] { Weekday.Tue }
        };

        var adResNonOverlapDay = await clientDriver1.PostAsJsonAsync("/api/advertisements", adDtoNonOverlapDay);
        Assert.Equal(HttpStatusCode.Created, adResNonOverlapDay.StatusCode);

        // 5. Register Driver 2 and verify Driver 2 can create advertisement at 08:00 on Monday -> SHOULD SUCCEED
        var regDriver2 = await client.PostAsJsonAsync("/api/users", new CreateUserDto
        {
            Name = "Driver",
            Surname = "Two",
            Email = emailDriver2,
            Password = "Password123!"
        });
        var authDriver2 = await regDriver2.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authDriver2);

        var clientDriver2 = _factory.CreateClient();
        clientDriver2.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authDriver2.Token);

        var routeRes2 = await clientDriver2.PostAsJsonAsync("/api/routes", new CreateRouteDto
        {
            Direction = TripDirection.ToWork,
            MiddlePoints = new List<PointDto>
            {
                new PointDto { Latitude = 52.1800, Longitude = 21.0200 }
            }
        });
        var route2 = await routeRes2.Content.ReadFromJsonAsync<RouteDto>();
        Assert.NotNull(route2);

        var adDtoDriver2 = new CreateAdvertisementDto
        {
            RouteId = route2.Id,
            Seats = 3,
            DepartureTime = new TimeOnly(8, 0),
            DaysOfWeek = new[] { Weekday.Mon }
        };

        var adResDriver2 = await clientDriver2.PostAsJsonAsync("/api/advertisements", adDtoDriver2);
        Assert.Equal(HttpStatusCode.Created, adResDriver2.StatusCode);
    }
}
