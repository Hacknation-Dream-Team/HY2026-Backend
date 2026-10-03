using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CarsController : ControllerBase
{
    private readonly ICarService _carService;

    public CarsController(ICarService carService)
    {
        _carService = carService;
    }

    [HttpGet("models")]
    public async Task<ActionResult<IEnumerable<CarModelDto>>> GetAllCarModels()
    {
        var models = await _carService.GetAllCarModelsAsync();
        return Ok(models);
    }

    [HttpPost]
    public async Task<ActionResult<UserCarDto>> AddUserCar(CreateUserCarDto createDto)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var car = await _carService.AddUserCarAsync(userId, createDto);
        return Ok(car);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserCarDto>>> GetMyCars()
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var cars = await _carService.GetUserCarsAsync(userId);
        return Ok(cars);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUserCar(long id)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var success = await _carService.DeleteUserCarAsync(id, userId);

        if (!success)
            return NotFound();

        return NoContent();
    }
}
