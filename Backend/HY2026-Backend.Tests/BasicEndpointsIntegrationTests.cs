using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using HY2026_Backend.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HY2026_Backend.Tests;

public class BasicEndpointsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public BasicEndpointsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetEndpoints_ReturnSuccess()
    {
        // Arrange
        var client = _factory.CreateClient();
        var uniqueEmail = $"basic.{Guid.NewGuid():N}@example.com";
        var password = "SecurePassword123!";

        var registerDto = new CreateUserDto
        {
            Name = "Basic",
            Surname = "Tester",
            Email = uniqueEmail,
            Password = password
        };

        var registerResponse = await client.PostAsJsonAsync("/api/users", registerDto);
        var authResult = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);

        var authenticatedClient = _factory.CreateClient();
        authenticatedClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authResult.Token);

        // Act & Assert

        // 1. Organizations
        var orgsResponse = await authenticatedClient.GetAsync("/api/organizations");
        Assert.Equal(HttpStatusCode.OK, orgsResponse.StatusCode);

        // 2. Cars Models
        var carModelsResponse = await authenticatedClient.GetAsync("/api/cars/models");
        Assert.Equal(HttpStatusCode.OK, carModelsResponse.StatusCode);

        // 3. User Cars
        var myCarsResponse = await authenticatedClient.GetAsync("/api/cars");
        Assert.Equal(HttpStatusCode.OK, myCarsResponse.StatusCode);

        // 4. Ride Requests
        var rideReqsResponse = await authenticatedClient.GetAsync("/api/riderequests");
        Assert.Equal(HttpStatusCode.OK, rideReqsResponse.StatusCode);

        // 5. Advertisements
        var adsResponse = await authenticatedClient.GetAsync("/api/advertisements");
        Assert.Equal(HttpStatusCode.OK, adsResponse.StatusCode);
    }
}
