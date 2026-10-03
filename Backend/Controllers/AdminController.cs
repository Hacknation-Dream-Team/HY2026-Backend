using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IOrganizationService _organizationService;
    private readonly IUserService _userService;

    public AdminController(
        IAdminService adminService,
        IOrganizationService organizationService,
        IUserService userService)
    {
        _adminService = adminService;
        _organizationService = organizationService;
        _userService = userService;
    }

    /// <summary>
    /// Gets overall system statistics and entity counts.
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(SystemStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemStatsDto>> GetStats()
    {
        var stats = await _adminService.GetSystemStatsAsync();
        return Ok(stats);
    }

    /// <summary>
    /// Retrieves all users in the system.
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
    {
        var users = await _adminService.GetAllUsersAsync();
        return Ok(users);
    }

    /// <summary>
    /// Updates a user's role (Admin / User).
    /// </summary>
    [HttpPut("users/{id:long}/role")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> UpdateUserRole(long id, [FromBody] UpdateUserRoleDto dto)
    {
        var updated = await _userService.UpdateUserRoleAsync(id, dto.Role);
        if (updated == null)
            return NotFound(new { message = $"User with ID {id} was not found." });

        return Ok(updated);
    }

    /// <summary>
    /// Retrieves all organizations in the system.
    /// </summary>
    [HttpGet("organizations")]
    [ProducesResponseType(typeof(IEnumerable<OrganizationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OrganizationDto>>> GetAllOrganizations()
    {
        var orgs = await _adminService.GetAllOrganizationsAsync();
        return Ok(orgs);
    }

    /// <summary>
    /// Creates a new organization.
    /// </summary>
    [HttpPost("organizations")]
    [ProducesResponseType(typeof(OrganizationDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<OrganizationDto>> CreateOrganization([FromBody] CreateOrganizationDto dto)
    {
        var org = await _organizationService.CreateOrganizationAsync(dto);
        return CreatedAtAction(nameof(GetAllOrganizations), new { id = org.Id }, org);
    }

    /// <summary>
    /// Updates an existing organization.
    /// </summary>
    [HttpPut("organizations/{id:long}")]
    [ProducesResponseType(typeof(OrganizationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrganizationDto>> UpdateOrganization(long id, [FromBody] UpdateOrganizationDto dto)
    {
        var updated = await _organizationService.UpdateOrganizationAsync(id, dto);
        if (updated == null)
            return NotFound(new { message = $"Organization with ID {id} was not found." });

        return Ok(updated);
    }

    /// <summary>
    /// Deletes an organization.
    /// </summary>
    [HttpDelete("organizations/{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteOrganization(long id)
    {
        var result = await _organizationService.DeleteOrganizationAsync(id);
        if (!result)
            return NotFound(new { message = $"Organization with ID {id} was not found." });

        return NoContent();
    }

    /// <summary>
    /// Retrieves all routes in the system.
    /// </summary>
    [HttpGet("routes")]
    [ProducesResponseType(typeof(IEnumerable<RouteDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RouteDto>>> GetAllRoutes()
    {
        var routes = await _adminService.GetAllRoutesAsync();
        return Ok(routes);
    }

    /// <summary>
    /// Retrieves all advertisements in the system.
    /// </summary>
    [HttpGet("advertisements")]
    [ProducesResponseType(typeof(IEnumerable<AdvertisementDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AdvertisementDto>>> GetAllAdvertisements()
    {
        var ads = await _adminService.GetAllAdvertisementsAsync();
        return Ok(ads);
    }

    /// <summary>
    /// Retrieves all ride requests in the system.
    /// </summary>
    [HttpGet("riderequests")]
    [ProducesResponseType(typeof(IEnumerable<RideRequestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RideRequestDto>>> GetAllRideRequests()
    {
        var requests = await _adminService.GetAllRideRequestsAsync();
        return Ok(requests);
    }

    /// <summary>
    /// Retrieves all matches in the system.
    /// </summary>
    [HttpGet("matches")]
    [ProducesResponseType(typeof(IEnumerable<MatchDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MatchDto>>> GetAllMatches()
    {
        var matches = await _adminService.GetAllMatchesAsync();
        return Ok(matches);
    }

    /// <summary>
    /// Retrieves all rides in the system.
    /// </summary>
    [HttpGet("rides")]
    [ProducesResponseType(typeof(IEnumerable<RideDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RideDto>>> GetAllRides()
    {
        var rides = await _adminService.GetAllRidesAsync();
        return Ok(rides);
    }
}
