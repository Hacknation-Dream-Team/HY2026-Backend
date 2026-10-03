using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using HY2026_Backend.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HY2026_Backend.Tests;

public class RouteIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public RouteIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateRoute_GetById_GetAll_Delete_Succeeds()
    {
        // Arrange
        var client = _factory.CreateClient();
        var uniqueEmail = $"route.user.{Guid.NewGuid():N}@example.com";
        var password = "SecurePassword123!";

        // STEP 1: Register and login user
        var registerDto = new CreateUserDto
        {
            Name = "Route",
            Surname = "Tester",
            Email = uniqueEmail,
            Phone = "+48111222333",
            Password = password
        };

        var registerResponse = await client.PostAsJsonAsync("/api/users", registerDto);
        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var authResult = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);
        var jwtToken = authResult.Token;
        var userId = authResult.User.Id;

        var authenticatedClient = _factory.CreateClient();
        authenticatedClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

        // STEP 2: Create a route
        var createRouteDto = new CreateRouteDto
        {
            StartP = new PointDto { Latitude = 52.2297, Longitude = 21.0122 }, // Warsaw
            EndP = new PointDto { Latitude = 50.0647, Longitude = 19.9450 },   // Krakow
            LookingFor = "Passenger / Pasażer"
        };

        var createResponse = await authenticatedClient.PostAsJsonAsync("/api/routes", createRouteDto);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdRoute = await createResponse.Content.ReadFromJsonAsync<RouteDto>();
        Assert.NotNull(createdRoute);
        Assert.True(createdRoute.Id > 0);
        Assert.Equal(userId, createdRoute.UserId);
        Assert.Equal(52.2297, createdRoute.StartP.Latitude, 4);
        Assert.Equal(21.0122, createdRoute.StartP.Longitude, 4);
        Assert.Equal(50.0647, createdRoute.EndP.Latitude, 4);
        Assert.Equal(19.9450, createdRoute.EndP.Longitude, 4);
        Assert.Equal("Passenger / Pasażer", createdRoute.LookingFor);

        var routeId = createdRoute.Id;

        // STEP 3: Get route by ID
        var getByIdResponse = await client.GetAsync($"/api/routes/{routeId}");
        Assert.Equal(HttpStatusCode.OK, getByIdResponse.StatusCode);

        var fetchedRoute = await getByIdResponse.Content.ReadFromJsonAsync<RouteDto>();
        Assert.NotNull(fetchedRoute);
        Assert.Equal(routeId, fetchedRoute.Id);
        Assert.Equal(userId, fetchedRoute.UserId);

        // STEP 4: Get all routes
        var getAllResponse = await client.GetAsync($"/api/routes?userId={userId}");
        Assert.Equal(HttpStatusCode.OK, getAllResponse.StatusCode);

        var routes = await getAllResponse.Content.ReadFromJsonAsync<List<RouteDto>>();
        Assert.NotNull(routes);
        Assert.Contains(routes, r => r.Id == routeId);

        // STEP 5: Delete route
        var deleteResponse = await authenticatedClient.DeleteAsync($"/api/routes/{routeId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // STEP 6: Verify deletion
        var getDeletedResponse = await client.GetAsync($"/api/routes/{routeId}");
        Assert.Equal(HttpStatusCode.NotFound, getDeletedResponse.StatusCode);
    }
}
