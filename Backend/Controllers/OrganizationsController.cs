using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HY2026_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationService _organizationService;

    public OrganizationsController(IOrganizationService organizationService)
    {
        _organizationService = organizationService;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrganizationDto>> CreateOrganization(CreateOrganizationDto createDto)
    {
        var org = await _organizationService.CreateOrganizationAsync(createDto);
        return CreatedAtAction(nameof(GetOrganization), new { id = org.Id }, org);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrganizationDto>> UpdateOrganization(long id, UpdateOrganizationDto updateDto)
    {
        var updated = await _organizationService.UpdateOrganizationAsync(id, updateDto);
        if (updated == null)
            return NotFound(new { message = $"Organization with ID {id} was not found." });

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteOrganization(long id)
    {
        var result = await _organizationService.DeleteOrganizationAsync(id);
        if (!result)
            return NotFound(new { message = $"Organization with ID {id} was not found." });

        return NoContent();
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrganizationDto>>> GetAllOrganizations()
    {
        var orgs = await _organizationService.GetAllOrganizationsAsync();
        return Ok(orgs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrganizationDto>> GetOrganization(long id)
    {
        var org = await _organizationService.GetOrganizationAsync(id);

        if (org == null)
            return NotFound();

        return Ok(org);
    }
}
