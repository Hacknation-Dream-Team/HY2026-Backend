using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using HY2026_Backend.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HY2026_Backend.Tests;

public class UserLifecycleIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public UserLifecycleIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task FullUserLifecycle_Register_Login_Update_Delete_Succeeds()
    {
        // Arrange
        var client = _factory.CreateClient();
        var uniqueEmail = $"test.user.{Guid.NewGuid():N}@example.com";
        var initialPassword = "SecurePassword123!";

        // STEP 1: Register a new user
        var registerDto = new CreateUserDto
        {
            Name = "John",
            Surname = "Doe",
            Email = uniqueEmail,
            Phone = "+48500600700",
            Password = initialPassword,
            ProfileImg = "https://example.com/avatar.jpg"
        };

        var registerResponse = await client.PostAsJsonAsync("/api/users", registerDto);
        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var registerResult = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(registerResult);
        Assert.False(string.IsNullOrWhiteSpace(registerResult.Token));
        Assert.Equal("John", registerResult.User.Name);
        Assert.Equal(uniqueEmail.ToLower(), registerResult.User.Email);

        var userId = registerResult.User.Id;

        // STEP 2: Authenticate (Login) user
        var loginDto = new LoginDto
        {
            Email = uniqueEmail,
            Password = initialPassword
        };

        var loginResponse = await client.PostAsJsonAsync("/api/users/login", loginDto);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var loginResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(loginResult);
        Assert.False(string.IsNullOrWhiteSpace(loginResult.Token));
        Assert.Equal(userId, loginResult.User.Id);

        var jwtToken = loginResult.Token;

        // STEP 3: Attempt to update another user's profile without permission (should return 403 Forbidden)
        var authenticatedClient = _factory.CreateClient();
        authenticatedClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

        var illegalUpdateDto = new UpdateUserDto
        {
            Name = "Hacker",
            Surname = "Test",
            Phone = "+48000000000"
        };

        var forbiddenResponse = await authenticatedClient.PutAsJsonAsync($"/api/users/{userId + 99999}", illegalUpdateDto);
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenResponse.StatusCode);

        // STEP 4: Update own profile (with Authorization Bearer JWT header)
        var updateDto = new UpdateUserDto
        {
            Name = "Jane",
            Surname = "Smith",
            Phone = "+48600700800",
            ProfileImg = "https://example.com/new_avatar.jpg"
        };

        var updateResponse = await authenticatedClient.PutAsJsonAsync($"/api/users/{userId}", updateDto);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updatedUser = await updateResponse.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(updatedUser);
        Assert.Equal("Jane", updatedUser.Name);
        Assert.Equal("Smith", updatedUser.Surname);
        Assert.Equal("+48600700800", updatedUser.Phone);

        // STEP 5: Get authenticated user profile via /api/users/me endpoint
        var meResponse = await authenticatedClient.GetAsync("/api/users/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        var meUser = await meResponse.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(meUser);
        Assert.Equal(userId, meUser.Id);
        Assert.Equal("Jane", meUser.Name);

        // STEP 6: Delete own account
        var deleteResponse = await authenticatedClient.DeleteAsync($"/api/users/{userId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // STEP 7: Verify user no longer exists
        var getDeletedUserResponse = await client.GetAsync($"/api/users/{userId}");
        Assert.Equal(HttpStatusCode.NotFound, getDeletedUserResponse.StatusCode);
    }

    [Fact]
    public async Task RegisterAndLogin_WithShortPassword_Succeeds()
    {
        var client = _factory.CreateClient();
        var uniqueEmail = $"short.pw.{Guid.NewGuid():N}@example.com";
        var shortPassword = "123";

        var registerDto = new CreateUserDto
        {
            Name = "Short",
            Surname = "Pass",
            Email = uniqueEmail,
            Password = shortPassword
        };

        var registerResponse = await client.PostAsJsonAsync("/api/users", registerDto);
        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var loginDto = new LoginDto
        {
            Email = uniqueEmail,
            Password = shortPassword
        };

        var loginResponse = await client.PostAsJsonAsync("/api/users/login", loginDto);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var loginResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(loginResult);
        Assert.False(string.IsNullOrWhiteSpace(loginResult.Token));
    }
}
