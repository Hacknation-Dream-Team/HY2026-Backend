using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AdvertisementsController : ControllerBase
{
    private readonly IAdvertisementService _advertisementService;

    public AdvertisementsController(IAdvertisementService advertisementService)
    {
        _advertisementService = advertisementService;
    }

    [HttpPost]
    public async Task<ActionResult<AdvertisementDto>> CreateAdvertisement(CreateAdvertisementDto createDto)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var ad = await _advertisementService.CreateAdvertisementAsync(userId, createDto);
            return CreatedAtAction(nameof(GetAdvertisement), new { id = ad.Id }, ad);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdvertisementDto>>> GetMyAdvertisements()
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ads = await _advertisementService.GetAdvertisementsAsync(userId);
        return Ok(ads);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AdvertisementDto>> GetAdvertisement(long id)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ad = await _advertisementService.GetAdvertisementAsync(id, userId);

        if (ad == null)
            return NotFound();

        return Ok(ad);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAdvertisement(long id)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var success = await _advertisementService.DeleteAdvertisementAsync(id, userId);

        if (!success)
            return NotFound();

        return NoContent();
    }
}
