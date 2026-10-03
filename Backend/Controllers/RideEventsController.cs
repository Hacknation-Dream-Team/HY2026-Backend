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
}
