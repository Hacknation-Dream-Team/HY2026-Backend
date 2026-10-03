using System.Security.Claims;
using HY2026_Backend.DTOs;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HY2026_Backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    private long GetUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (long.TryParse(claim, out var userId))
        {
            return userId;
        }
        throw new HubException("Unauthorized: Invalid user identifier.");
    }

    public async Task SendMessage(long recipientId, string content)
    {
        var senderId = GetUserId();
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new HubException("Message content cannot be empty.");
        }

        try
        {
            var message = await _chatService.SendMessageAsync(senderId, recipientId, content);

            // Broadcast real-time message & notification to recipient
            await Clients.User(recipientId.ToString()).SendAsync("ReceiveMessage", message);
            await Clients.User(recipientId.ToString()).SendAsync("NewMessageNotification", message);

            // Echo back to sender
            await Clients.Caller.SendAsync("MessageSent", message);
        }
        catch (Exception ex)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task MarkAsRead(long otherUserId)
    {
        var userId = GetUserId();
        await _chatService.MarkMessagesAsReadAsync(userId, otherUserId);

        // Notify other user that messages were read
        await Clients.User(otherUserId.ToString()).SendAsync("MessagesRead", userId);
    }
}
