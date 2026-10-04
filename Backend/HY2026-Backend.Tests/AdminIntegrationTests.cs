using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using HY2026_Backend.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HY2026_Backend.Tests;

public class AdminIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AdminIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task PublicRegistration_AlwaysRegistersAsUser_AndRegularUser_CannotAccessAdminEndpoints()
    {
        var client = _factory.CreateClient();
        var email = $"user.{Guid.NewGuid():N}@example.com";

        var registerDto = new CreateUserDto
        {
            Name = "Regular",
            Surname = "User",
            Email = email,
            Password = "Password123!"
        };

        var registerResponse = await client.PostAsJsonAsync("/api/users", registerDto);
        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);
        var authResult = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);
        Assert.Equal("User", authResult.User.Role);

        var userClient = _factory.CreateClient();
        userClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authResult.Token);

        // Attempt to access admin stats
        var statsResponse = await userClient.GetAsync("/api/admin/stats");
        Assert.Equal(HttpStatusCode.Forbidden, statsResponse.StatusCode);

        // Attempt to create organization
        var createOrgDto = new CreateOrganizationDto
        {
            Name = "Forbidden Org",
            Location = new PointDto { Latitude = 52.2, Longitude = 21.0 }
        };
        var createOrgResponse = await userClient.PostAsJsonAsync("/api/organizations", createOrgDto);
        Assert.Equal(HttpStatusCode.Forbidden, createOrgResponse.StatusCode);
    }

    [Fact]
    public async Task AdminUser_CanAccessStats_ManageOrganizations_AndUpdateUserRoles()
    {
        var client = _factory.CreateClient();

        // Login as seeded Admin
        var adminLoginDto = new LoginDto
        {
            Email = "admin@system.local",
            Password = "AdminHaslo123!"
        };

        var loginResponse = await client.PostAsJsonAsync("/api/users/login", adminLoginDto);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var adminAuth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(adminAuth);
        Assert.Equal("Admin", adminAuth.User.Role);

        var adminClient = _factory.CreateClient();
        adminClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminAuth.Token);

        // 1. Get System Stats
        var statsResponse = await adminClient.GetAsync("/api/admin/stats");
        Assert.Equal(HttpStatusCode.OK, statsResponse.StatusCode);
        var stats = await statsResponse.Content.ReadFromJsonAsync<SystemStatsDto>();
        Assert.NotNull(stats);
        Assert.True(stats.TotalUsers >= 1);
        Assert.True(stats.TotalAdmins >= 1);

        // 2. Create Organization as Admin
        var createOrgDto = new CreateOrganizationDto
        {
            Name = "Test Admin Company",
            Address = "ul. Testowa 10, Warszawa",
            Location = new PointDto { Latitude = 52.2297, Longitude = 21.0122 }
        };

        var orgResponse = await adminClient.PostAsJsonAsync("/api/organizations", createOrgDto);
        Assert.Equal(HttpStatusCode.Created, orgResponse.StatusCode);
        var createdOrg = await orgResponse.Content.ReadFromJsonAsync<OrganizationDto>();
        Assert.NotNull(createdOrg);
        Assert.Equal("Test Admin Company", createdOrg.Name);

        // 3. Edit Organization as Admin
        var updateOrgDto = new UpdateOrganizationDto
        {
            Name = "Test Admin Company Updated",
            Address = "ul. Nowa 20, Kraków",
            Location = new PointDto { Latitude = 50.0647, Longitude = 19.9450 }
        };

        var updateOrgResponse = await adminClient.PutAsJsonAsync($"/api/organizations/{createdOrg.Id}", updateOrgDto);
        Assert.Equal(HttpStatusCode.OK, updateOrgResponse.StatusCode);
        var updatedOrg = await updateOrgResponse.Content.ReadFromJsonAsync<OrganizationDto>();
        Assert.NotNull(updatedOrg);
        Assert.Equal("Test Admin Company Updated", updatedOrg.Name);

        // 4. Register a regular user and promote to Admin
        var userEmail = $"promoteme.{Guid.NewGuid():N}@example.com";
        var userRegDto = new CreateUserDto
        {
            Name = "ToPromote",
            Surname = "User",
            Email = userEmail,
            Password = "UserPassword123!"
        };
        var userRegResponse = await client.PostAsJsonAsync("/api/users", userRegDto);
        var userAuth = await userRegResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(userAuth);
        Assert.Equal("User", userAuth.User.Role);

        // Admin changes user role to Admin
        var roleUpdateDto = new UpdateUserRoleDto { Role = "Admin" };
        var roleUpdateResponse = await adminClient.PutAsJsonAsync($"/api/admin/users/{userAuth.User.Id}/role", roleUpdateDto);
        Assert.Equal(HttpStatusCode.OK, roleUpdateResponse.StatusCode);
        var promotedUser = await roleUpdateResponse.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(promotedUser);
        Assert.Equal("Admin", promotedUser.Role);
    }
}
