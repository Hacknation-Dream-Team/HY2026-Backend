using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoutesController : ControllerBase
{
    private readonly IRouteService _routeService;

    public RoutesController(IRouteService routeService)
    {
        _routeService = routeService;
    }

    /// <summary>
    /// Creates a new route for the authenticated user.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(RouteDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<RouteDto>> Create([FromBody] CreateRouteDto dto)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        try
        {
            var route = await _routeService.CreateRouteAsync(currentUserId.Value, dto);
            return CreatedAtAction(nameof(GetById), new { id = route.Id }, route);
        }
        catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves a route by its ID.
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(RouteDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RouteDto>> GetById(long id)
    {
        var route = await _routeService.GetRouteByIdAsync(id);
        if (route == null)
        {
            return NotFound(new { message = $"Route with ID {id} was not found." });
        }
        return Ok(route);
    }

    /// <summary>
    /// Gets all routes (optionally filtered by user ID).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<RouteDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RouteDto>>> GetAll([FromQuery] long? userId)
    {
        var routes = await _routeService.GetAllRoutesAsync(userId);
        return Ok(routes);
    }

    /// <summary>
    /// Deletes a route (Requires authentication; users can only delete their own routes).
    /// </summary>
    [HttpDelete("{id:long}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(long id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        try
        {
            var result = await _routeService.DeleteRouteAsync(id, currentUserId.Value);
            if (!result)
            {
                return NotFound(new { message = $"Route with ID {id} was not found." });
            }
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    private long? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
