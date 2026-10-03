using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RideRequestsController : ControllerBase
{
    private readonly IRideRequestService _rideRequestService;

    public RideRequestsController(IRideRequestService rideRequestService)
    {
        _rideRequestService = rideRequestService;
    }

    [HttpPost]
    public async Task<ActionResult<RideRequestDto>> CreateRideRequest(CreateRideRequestDto createDto)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var request = await _rideRequestService.CreateRideRequestAsync(userId, createDto);
            return CreatedAtAction(nameof(GetRideRequest), new { id = request.Id }, request);
        }
        catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RideRequestDto>>> GetMyRideRequests()
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var requests = await _rideRequestService.GetRideRequestsAsync(userId);
        return Ok(requests);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RideRequestDto>> GetRideRequest(long id)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var request = await _rideRequestService.GetRideRequestAsync(id, userId);

        if (request == null)
            return NotFound();

        return Ok(request);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRideRequest(long id)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var success = await _rideRequestService.DeleteRideRequestAsync(id, userId);

        if (!success)
            return NotFound();

        return NoContent();
    }
}
