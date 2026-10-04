using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Hubs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace HY2026_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatController(IChatService chatService, IHubContext<ChatHub> hubContext)
    {
        _chatService = chatService;
        _hubContext = hubContext;
    }

    private long GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (long.TryParse(claim, out var userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("User ID claim missing.");
    }

    /// <summary>
    /// Pobiera listę aktywnych konwersacji zalogowanego użytkownika.
    /// </summary>
    [HttpGet("conversations")]
    public async Task<ActionResult<List<ConversationSummaryDto>>> GetConversations()
    {
        var userId = GetUserId();
        var conversations = await _chatService.GetConversationsAsync(userId);
        return Ok(conversations);
    }

    /// <summary>
    /// Pobiera historię wiadomości z określonym użytkownikiem.
    /// </summary>
    [HttpGet("messages/{otherUserId}")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetMessages(long otherUserId)
    {
        var userId = GetUserId();
        var history = await _chatService.GetMessageHistoryAsync(userId, otherUserId);
        return Ok(history);
    }

    /// <summary>
    /// Wysyła wiadomość do innego użytkownika.
    /// </summary>
    [HttpPost("messages")]
    public async Task<ActionResult<ChatMessageDto>> SendMessage([FromBody] SendMessageDto dto)
    {
        var userId = GetUserId();
        if (dto.RecipientId <= 0)
        {
            return BadRequest("Invalid recipient ID.");
        }
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest("Message content cannot be empty.");
        }

        try
        {
            var message = await _chatService.SendMessageAsync(userId, dto.RecipientId, dto.Content);

            // SignalR real-time notification broadcast
            await _hubContext.Clients.User(dto.RecipientId.ToString()).SendAsync("ReceiveMessage", message);
            await _hubContext.Clients.User(dto.RecipientId.ToString()).SendAsync("NewMessageNotification", message);

            return Ok(message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Oznacza wiadomości od wskazanego nadawcy jako przeczytane.
    /// </summary>
    [HttpPost("read/{otherUserId}")]
    public async Task<IActionResult> MarkAsRead(long otherUserId)
    {
        var userId = GetUserId();
        await _chatService.MarkMessagesAsReadAsync(userId, otherUserId);

        // SignalR notification to sender
        await _hubContext.Clients.User(otherUserId.ToString()).SendAsync("MessagesRead", userId);

        return Ok(new { message = "Messages marked as read." });
    }

    /// <summary>
    /// Pobiera całkowitą liczbę nieprzeczytanych wiadomości dla zalogowanego użytkownika.
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountDto>> GetUnreadCount()
    {
        var userId = GetUserId();
        var count = await _chatService.GetTotalUnreadCountAsync(userId);
        return Ok(new UnreadCountDto { TotalUnreadCount = count });
    }
}
