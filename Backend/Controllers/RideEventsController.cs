using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RideEventsController : ControllerBase
{
    private readonly IRideEventService _rideEventService;

    public RideEventsController(IRideEventService rideEventService)
    {
        _rideEventService = rideEventService;
    }

    [HttpPost]
    public async Task<ActionResult<RideEventDto>> CreateEvent([FromBody] CreateRideEventDto createDto)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var result = await _rideEventService.CreateRideEventAsync(userId, createDto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("advertisement/{advertisementId:long}")]
    public async Task<ActionResult<IEnumerable<RideEventDto>>> GetEventsForAdvertisement(long advertisementId)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var events = await _rideEventService.GetEventsForAdvertisementAsync(advertisementId, userId);
        return Ok(events);
    }

    /// <summary>
    /// Current state of cancellations (ride_status view) for an advertisement, optionally for one date.
    /// </summary>
    [HttpGet("status/advertisement/{advertisementId:long}")]
    public async Task<ActionResult<IEnumerable<RideStatusDto>>> GetRideStatus(long advertisementId, [FromQuery] DateOnly? date)
    {
        var result = await _rideEventService.GetRideStatusAsync(advertisementId, date);
        return Ok(result);
    }

    /// <summary>
    /// Whether the passenger of a match rides on the given date (accepted, scheduled day, not cancelled).
    /// </summary>
    [HttpGet("riding/match/{matchId:long}")]
    public async Task<ActionResult<PassengerRidingDto>> IsRiding(long matchId, [FromQuery] DateOnly date)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            return Ok(await _rideEventService.IsPassengerRidingAsync(matchId, date, userId));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
