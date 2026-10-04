using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchesController : ControllerBase
{
    private readonly IMatchService _matchService;

    public MatchesController(IMatchService matchService)
    {
        _matchService = matchService;
    }

    /// <summary>
    /// Finds matches for a ride request using PostgreSQL PostGIS find_matches procedure.
    /// If requestId is omitted, automatically finds matches for the authenticated user's active ride request.
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<MatchResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<MatchResultDto>>> FindMatches(
        [FromQuery] long? requestId,
        [FromQuery] int? maxDistanceMeters,
        [FromQuery] int? timeWindowMinutes)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        try
        {
            var results = await _matchService.FindMatchesAsync(
                currentUserId.Value, 
                requestId, 
                maxDistanceMeters, 
                timeWindowMinutes);

            return Ok(results);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Creates/submits a match between a ride request and an advertisement.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(MatchDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<MatchDto>> CreateMatch([FromBody] CreateMatchDto dto)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        try
        {
            var match = await _matchService.CreateMatchAsync(currentUserId.Value, dto);
            return CreatedAtAction(nameof(GetMyMatches), null, match);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves all matches for the authenticated user (either as passenger or driver).
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<MatchDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<MatchDto>>> GetMyMatches()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var matches = await _matchService.GetMatchesForUserAsync(currentUserId.Value);
        return Ok(matches);
    }

    /// <summary>
    /// Updates the status of a match (e.g. Accept, Reject, Cancel).
    /// </summary>
    [HttpPut("{id:long}/status")]
    [Authorize]
    [ProducesResponseType(typeof(MatchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MatchDto>> UpdateStatus(long id, [FromBody] System.Text.Json.JsonElement body)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        try
        {
            MatchStatus status;
            if (body.ValueKind == System.Text.Json.JsonValueKind.Object && body.TryGetProperty("status", out var statusProp))
            {
                status = ParseMatchStatus(statusProp);
            }
            else
            {
                status = ParseMatchStatus(body);
            }

            var updated = await _matchService.UpdateMatchStatusAsync(id, currentUserId.Value, status);
            if (updated == null)
            {
                return NotFound(new { message = $"Match with ID {id} was not found." });
            }

            return Ok(updated);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private static MatchStatus ParseMatchStatus(System.Text.Json.JsonElement element)
    {
        if (element.ValueKind == System.Text.Json.JsonValueKind.Number && element.TryGetInt32(out var val))
        {
            return (MatchStatus)val;
        }
        if (element.ValueKind == System.Text.Json.JsonValueKind.String && Enum.TryParse<MatchStatus>(element.GetString(), true, out var parsed))
        {
            return parsed;
        }
        throw new InvalidOperationException("Invalid status format.");
    }

    private long? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
