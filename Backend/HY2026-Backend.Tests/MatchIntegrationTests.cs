using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HY2026_Backend.Tests;

public class MatchIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public MatchIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task FindMatches_NoActiveRequest_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var email = $"noride.{Guid.NewGuid():N}@example.com";

        // Register user
        var regDto = new CreateUserDto
        {
            Name = "NoRide",
            Surname = "User",
            Email = email,
            Password = "Password123!"
        };

        var regRes = await client.PostAsJsonAsync("/api/users", regDto);
        var authRes = await regRes.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authRes);

        var authClient = _factory.CreateClient();
        authClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authRes.Token);

        // Find matches without active ride request
        var res = await authClient.GetAsync("/api/matches");
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }
}
