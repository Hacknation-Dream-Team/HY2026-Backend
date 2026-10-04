using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HY2026_Backend.Tests;

public class RideValidationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public RideValidationIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private record TestUser(HttpClient Client, long Id);

    private async Task<TestUser> RegisterUserAsync(bool withHome = true)
    {
        var anon = _factory.CreateClient();
        var res = await anon.PostAsJsonAsync("/api/users", new CreateUserDto
        {
            Name = "Test",
            Surname = "User",
            Email = $"rv.{Guid.NewGuid():N}@example.com",
            Password = "Password123!"
        });
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var auth = await res.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth);

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        var user = new TestUser(client, auth.User.Id);

        if (withHome)
        {
            var home = await client.PutAsJsonAsync("/api/users/me/home-address", new UpdateHomeAddressDto
            {
                HomeAddress = "ul. Testowa 1, Warszawa",
                HomeLocation = new PointDto { Latitude = 52.2000, Longitude = 21.0000 }
            });
            Assert.Equal(HttpStatusCode.OK, home.StatusCode);
        }
        return user;
    }

    private async Task<RouteDto> CreateRouteAsync(TestUser driver, TripDirection direction = TripDirection.ToWork)
    {
        var res = await driver.Client.PostAsJsonAsync("/api/routes", new CreateRouteDto
        {
            Direction = direction,
            MiddlePoints = new List<PointDto> { new() { Latitude = 52.2100, Longitude = 21.0100 } }
        });
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return (await res.Content.ReadFromJsonAsync<RouteDto>())!;
    }

    private async Task<AdvertisementDto> CreateAdAsync(TestUser driver, long routeId, short seats = 3)
    {
        var res = await driver.Client.PostAsJsonAsync("/api/advertisements", new CreateAdvertisementDto
        {
            RouteId = routeId,
            Seats = seats,
            DepartureTime = new TimeOnly(8, 0),
            DaysOfWeek = new[] { Weekday.Mon }
        });
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return (await res.Content.ReadFromJsonAsync<AdvertisementDto>())!;
    }

    private async Task<RideRequestDto> CreateRequestAsync(TestUser passenger, TripDirection direction = TripDirection.ToWork)
    {
        var res = await passenger.Client.PostAsJsonAsync("/api/riderequests", new CreateRideRequestDto
        {
            Direction = direction,
            DepartureTime = new TimeOnly(8, 0),
            DaysOfWeek = new[] { Weekday.Mon }
        });
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return (await res.Content.ReadFromJsonAsync<RideRequestDto>())!;
    }

    private async Task<HttpResponseMessage> PostMatchAsync(TestUser passenger, long adId, long requestId, short pickup = 0, short dropoff = 2)
    {
        return await passenger.Client.PostAsJsonAsync("/api/matches", new CreateMatchDto
        {
            AdvertisementId = adId,
            RequestId = requestId,
            PickupSeq = pickup,
            DropoffSeq = dropoff
        });
    }

    private static DateOnly NextWeekday(DayOfWeek day)
    {
        var d = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        while (d.DayOfWeek != day) d = d.AddDays(1);
        return d;
    }

    private async Task<(TestUser driver, TestUser passenger, AdvertisementDto ad, MatchDto match)> SetupMatchAsync(short seats = 3)
    {
        var driver = await RegisterUserAsync();
        var passenger = await RegisterUserAsync();
        var route = await CreateRouteAsync(driver);
        var ad = await CreateAdAsync(driver, route.Id, seats);
        var request = await CreateRequestAsync(passenger);
        var res = await PostMatchAsync(passenger, ad.Id, request.Id);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var match = (await res.Content.ReadFromJsonAsync<MatchDto>())!;
        return (driver, passenger, ad, match);
    }

    private static Task<HttpResponseMessage> SetStatusAsync(TestUser user, long matchId, MatchStatus status)
        => user.Client.PutAsJsonAsync($"/api/matches/{matchId}/status", status);

    // ---- Users: home address ----

    [Fact]
    public async Task Me_WithoutHomeAddress_HasWarning_AndClearsAfterUpdate()
    {
        var user = await RegisterUserAsync(withHome: false);

        var before = await user.Client.GetFromJsonAsync<UserDto>("/api/users/me");
        Assert.NotNull(before);
        Assert.False(string.IsNullOrEmpty(before.Warning));

        var upd = await user.Client.PutAsJsonAsync("/api/users/me/home-address", new UpdateHomeAddressDto
        {
            HomeAddress = "ul. Nowa 5",
            HomeLocation = new PointDto { Latitude = 52.1, Longitude = 21.1 }
        });
        Assert.Equal(HttpStatusCode.OK, upd.StatusCode);
        var after = await upd.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(after);
        Assert.Null(after.Warning);
        Assert.Equal("ul. Nowa 5", after.HomeAddress);
        Assert.Equal(52.1, after.HomeLocation!.Latitude, 4);
    }

    [Fact]
    public async Task UpdateHomeAddress_Unauthenticated_ReturnsUnauthorized()
    {
        var res = await _factory.CreateClient().PutAsJsonAsync("/api/users/me/home-address", new UpdateHomeAddressDto
        {
            HomeAddress = "x",
            HomeLocation = new PointDto { Latitude = 1, Longitude = 1 }
        });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task FindMatches_WithoutHomeAddress_ReturnsBadRequest()
    {
        var user = await RegisterUserAsync(withHome: false);
        var req = await user.Client.PostAsJsonAsync("/api/riderequests", new CreateRideRequestDto
        {
            Direction = TripDirection.ToWork,
            DepartureTime = new TimeOnly(8, 0),
            DaysOfWeek = new[] { Weekday.Mon }
        });
        Assert.Equal(HttpStatusCode.Created, req.StatusCode);

        var res = await user.Client.GetAsync("/api/matches");
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ---- Route stops view ----

    [Fact]
    public async Task GetStops_ReturnsFullRouteStartingFromSeqZero()
    {
        var driver = await RegisterUserAsync();
        var route = await CreateRouteAsync(driver);

        var res = await _factory.CreateClient().GetAsync($"/api/routes/{route.Id}/stops");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var stops = (await res.Content.ReadFromJsonAsync<List<RouteStopDto>>())!;

        // home + 1 intermediate + office
        Assert.Equal(3, stops.Count);
        Assert.Equal(new short[] { 0, 1, 2 }, stops.Select(s => s.Seq).ToArray());
    }

    [Fact]
    public async Task GetStops_UnknownRoute_ReturnsNotFound()
    {
        var res = await _factory.CreateClient().GetAsync("/api/routes/999999999/stops");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    // ---- Advertisement seats vs car ----

    [Fact]
    public async Task CreateAdvertisement_SeatsExceedCarCapacity_ReturnsBadRequest()
    {
        var driver = await RegisterUserAsync();
        var route = await CreateRouteAsync(driver);

        var carRes = await driver.Client.PostAsJsonAsync("/api/cars", new CreateUserCarDto
        {
            ModelName = "Custom",
            Plate = "WX12345",
            Color = "red",
            PassengerSeats = 2
        });
        Assert.Equal(HttpStatusCode.OK, carRes.StatusCode);
        var car = (await carRes.Content.ReadFromJsonAsync<UserCarDto>())!;

        var tooMany = await driver.Client.PostAsJsonAsync("/api/advertisements", new CreateAdvertisementDto
        {
            RouteId = route.Id,
            UsersCarId = car.Id,
            Seats = 3,
            DepartureTime = new TimeOnly(8, 0),
            DaysOfWeek = new[] { Weekday.Mon }
        });
        Assert.Equal(HttpStatusCode.BadRequest, tooMany.StatusCode);

        var ok = await driver.Client.PostAsJsonAsync("/api/advertisements", new CreateAdvertisementDto
        {
            RouteId = route.Id,
            UsersCarId = car.Id,
            Seats = 2,
            DepartureTime = new TimeOnly(8, 0),
            DaysOfWeek = new[] { Weekday.Mon }
        });
        Assert.Equal(HttpStatusCode.Created, ok.StatusCode);
    }

    // ---- Create match validations ----

    [Fact]
    public async Task CreateMatch_ValidStops_ReturnsCreatedPending()
    {
        var (_, _, _, match) = await SetupMatchAsync();
        Assert.Equal(MatchStatus.Pending, match.Status);
    }

    [Fact]
    public async Task CreateMatch_SeqNotInRouteStops_ReturnsBadRequest()
    {
        var driver = await RegisterUserAsync();
        var passenger = await RegisterUserAsync();
        var ad = await CreateAdAsync(driver, (await CreateRouteAsync(driver)).Id);
        var request = await CreateRequestAsync(passenger);

        var res = await PostMatchAsync(passenger, ad.Id, request.Id, pickup: 1, dropoff: 99);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task CreateMatch_PickupNotBeforeDropoff_ReturnsBadRequest()
    {
        var driver = await RegisterUserAsync();
        var passenger = await RegisterUserAsync();
        var ad = await CreateAdAsync(driver, (await CreateRouteAsync(driver)).Id);
        var request = await CreateRequestAsync(passenger);

        var res = await PostMatchAsync(passenger, ad.Id, request.Id, pickup: 2, dropoff: 1);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task CreateMatch_DirectionMismatch_ReturnsBadRequest()
    {
        var driver = await RegisterUserAsync();
        var passenger = await RegisterUserAsync();
        var ad = await CreateAdAsync(driver, (await CreateRouteAsync(driver, TripDirection.ToWork)).Id);
        var request = await CreateRequestAsync(passenger, TripDirection.ToHome);

        var res = await PostMatchAsync(passenger, ad.Id, request.Id);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task CreateMatch_Duplicate_ReturnsBadRequest()
    {
        var driver = await RegisterUserAsync();
        var passenger = await RegisterUserAsync();
        var ad = await CreateAdAsync(driver, (await CreateRouteAsync(driver)).Id);
        var request = await CreateRequestAsync(passenger);

        Assert.Equal(HttpStatusCode.Created, (await PostMatchAsync(passenger, ad.Id, request.Id)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await PostMatchAsync(passenger, ad.Id, request.Id)).StatusCode);
    }

    [Fact]
    public async Task CreateMatch_ForSomeoneElsesRequest_ReturnsForbidden()
    {
        var driver = await RegisterUserAsync();
        var passenger = await RegisterUserAsync();
        var intruder = await RegisterUserAsync();
        var ad = await CreateAdAsync(driver, (await CreateRouteAsync(driver)).Id);
        var request = await CreateRequestAsync(passenger);

        var res = await PostMatchAsync(intruder, ad.Id, request.Id);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    // ---- Update status rules ----

    [Fact]
    public async Task UpdateStatus_PassengerCannotAccept_ReturnsForbidden()
    {
        var (_, passenger, _, match) = await SetupMatchAsync();

        var res = await SetStatusAsync(passenger, match.Id, MatchStatus.Accepted);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_DriverAccepts_ReturnsOk()
    {
        var (driver, _, _, match) = await SetupMatchAsync();

        var res = await SetStatusAsync(driver, match.Id, MatchStatus.Accepted);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var updated = await res.Content.ReadFromJsonAsync<MatchDto>();
        Assert.Equal(MatchStatus.Accepted, updated!.Status);
    }

    [Fact]
    public async Task UpdateStatus_PassengerCanCancel_ThenNoFurtherChanges()
    {
        var (driver, passenger, _, match) = await SetupMatchAsync();

        Assert.Equal(HttpStatusCode.OK, (await SetStatusAsync(passenger, match.Id, MatchStatus.Cancelled)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await SetStatusAsync(driver, match.Id, MatchStatus.Accepted)).StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_SetPending_ReturnsBadRequest()
    {
        var (driver, _, _, match) = await SetupMatchAsync();

        var res = await SetStatusAsync(driver, match.Id, MatchStatus.Pending);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_OutsiderCannotChange_ReturnsForbidden()
    {
        var (_, _, _, match) = await SetupMatchAsync();
        var outsider = await RegisterUserAsync();

        var res = await SetStatusAsync(outsider, match.Id, MatchStatus.Cancelled);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_AcceptBeyondSeats_ReturnsBadRequest()
    {
        var driver = await RegisterUserAsync();
        var p1 = await RegisterUserAsync();
        var p2 = await RegisterUserAsync();
        var ad = await CreateAdAsync(driver, (await CreateRouteAsync(driver)).Id, seats: 1);

        var m1 = (await (await PostMatchAsync(p1, ad.Id, (await CreateRequestAsync(p1)).Id)).Content.ReadFromJsonAsync<MatchDto>())!;
        var m2 = (await (await PostMatchAsync(p2, ad.Id, (await CreateRequestAsync(p2)).Id)).Content.ReadFromJsonAsync<MatchDto>())!;

        Assert.Equal(HttpStatusCode.OK, (await SetStatusAsync(driver, m1.Id, MatchStatus.Accepted)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await SetStatusAsync(driver, m2.Id, MatchStatus.Accepted)).StatusCode);

        // freeing the seat allows the second acceptance
        Assert.Equal(HttpStatusCode.OK, (await SetStatusAsync(p1, m1.Id, MatchStatus.Cancelled)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await SetStatusAsync(driver, m2.Id, MatchStatus.Accepted)).StatusCode);
    }

    // ---- Ride events & ride_status ----

    [Fact]
    public async Task RideEvent_DateOutsideDaysOfWeek_ReturnsBadRequest()
    {
        var (driver, _, ad, _) = await SetupMatchAsync();

        var res = await driver.Client.PostAsJsonAsync("/api/rideevents", new CreateRideEventDto
        {
            AdvertisementId = ad.Id,
            RideDate = NextWeekday(DayOfWeek.Tuesday),
            Event = RideEventType.Cancelled
        });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task RideEvent_PassengerCannotCancelWholeRide_ReturnsForbidden()
    {
        var (_, passenger, ad, _) = await SetupMatchAsync();

        var res = await passenger.Client.PostAsJsonAsync("/api/rideevents", new CreateRideEventDto
        {
            AdvertisementId = ad.Id,
            RideDate = NextWeekday(DayOfWeek.Monday),
            Event = RideEventType.Cancelled
        });
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task IsRiding_FollowsMatchStatusAndCancellations()
    {
        var (driver, passenger, ad, match) = await SetupMatchAsync();
        var monday = NextWeekday(DayOfWeek.Monday);
        var url = $"/api/rideevents/riding/match/{match.Id}?date={monday:yyyy-MM-dd}";

        // pending match -> not riding
        var pending = await passenger.Client.GetFromJsonAsync<PassengerRidingDto>(url);
        Assert.False(pending!.IsRiding);

        Assert.Equal(HttpStatusCode.OK, (await SetStatusAsync(driver, match.Id, MatchStatus.Accepted)).StatusCode);
        Assert.True((await passenger.Client.GetFromJsonAsync<PassengerRidingDto>(url))!.IsRiding);

        // non-scheduled weekday -> not riding
        var tuesday = NextWeekday(DayOfWeek.Tuesday);
        var off = await passenger.Client.GetFromJsonAsync<PassengerRidingDto>(
            $"/api/rideevents/riding/match/{match.Id}?date={tuesday:yyyy-MM-dd}");
        Assert.False(off!.IsRiding);

        // driver cancels whole ride -> not riding
        var cancel = await driver.Client.PostAsJsonAsync("/api/rideevents", new CreateRideEventDto
        {
            AdvertisementId = ad.Id,
            RideDate = monday,
            Event = RideEventType.Cancelled
        });
        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);
        Assert.False((await passenger.Client.GetFromJsonAsync<PassengerRidingDto>(url))!.IsRiding);

        var statuses = await passenger.Client.GetFromJsonAsync<List<RideStatusDto>>(
            $"/api/rideevents/status/advertisement/{ad.Id}?date={monday:yyyy-MM-dd}");
        Assert.Contains(statuses!, s => s.MatchId == null && s.Event == RideEventType.Cancelled);

        // restoring -> riding again
        var restore = await driver.Client.PostAsJsonAsync("/api/rideevents", new CreateRideEventDto
        {
            AdvertisementId = ad.Id,
            RideDate = monday,
            Event = RideEventType.Restored
        });
        Assert.Equal(HttpStatusCode.OK, restore.StatusCode);
        Assert.True((await passenger.Client.GetFromJsonAsync<PassengerRidingDto>(url))!.IsRiding);
    }

    [Fact]
    public async Task IsRiding_Outsider_ReturnsForbidden()
    {
        var (_, _, _, match) = await SetupMatchAsync();
        var outsider = await RegisterUserAsync();

        var res = await outsider.Client.GetAsync($"/api/rideevents/riding/match/{match.Id}?date={NextWeekday(DayOfWeek.Monday):yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }
}
