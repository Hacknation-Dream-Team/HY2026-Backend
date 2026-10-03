using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Retrieves the profile of the currently authenticated user.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var user = await _userService.GetUserByIdAsync(currentUserId.Value);
        if (user == null)
        {
            return NotFound(new { message = "User account not found." });
        }

        return Ok(user);
    }

    /// <summary>
    /// Gets the list of all users.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    /// <summary>
    /// Retrieves a user by their ID.
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetById(long id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = $"User with ID {id} was not found." });
        }
        return Ok(user);
    }

    /// <summary>
    /// Registers a new user and returns a JWT token.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Create([FromBody] CreateUserDto dto)
    {
        try
        {
            var authResponse = await _userService.CreateUserAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = authResponse.User.Id }, authResponse);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates user details (Requires authentication; users can only edit their own profile).
    /// </summary>
    [HttpPut("{id:long}")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> Update(long id, [FromBody] UpdateUserDto dto)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        if (currentUserId.Value != id)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to edit another user's profile." });
        }

        var updatedUser = await _userService.UpdateUserAsync(id, dto);
        if (updatedUser == null)
        {
            return NotFound(new { message = $"User with ID {id} was not found." });
        }
        return Ok(updatedUser);
    }

    /// <summary>
    /// Deletes a user account (Requires authentication; users can only delete their own profile).
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

        if (currentUserId.Value != id)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to delete another user's account." });
        }

        var result = await _userService.DeleteUserAsync(id);
        if (!result)
        {
            return NotFound(new { message = $"User with ID {id} was not found." });
        }
        return NoContent();
    }

    /// <summary>
    /// Authenticates a user (email/password verification) and returns a JWT token.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var authResponse = await _userService.AuthenticateAsync(dto);
        if (authResponse == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }
        return Ok(authResponse);
    }

    private long? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
