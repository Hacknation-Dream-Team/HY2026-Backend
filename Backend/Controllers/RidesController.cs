using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RidesController : ControllerBase
{
    private readonly IRideService _rideService;

    public RidesController(IRideService rideService)
    {
        _rideService = rideService;
    }

    [HttpPost]
    public async Task<ActionResult<RideDto>> CreateRide(CreateRideDto createDto)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var ride = await _rideService.CreateRideAsync(createDto, userId);
            return Ok(ride); // Not using CreatedAtAction since there's no GetRide by ID right now
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RideDto>>> GetMyRides()
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var rides = await _rideService.GetMyRidesAsync(userId);
        return Ok(rides);
    }
}
