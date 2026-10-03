using System.Collections.Concurrent;
using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Services;

public class InMemoryChatService : IChatService
{
    private readonly ConcurrentDictionary<string, List<ChatMessageDto>> _conversations = new();
    private readonly IServiceScopeFactory _scopeFactory;

    public InMemoryChatService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    private static string GetConversationKey(long id1, long id2)
    {
        return id1 < id2 ? $"{id1}_{id2}" : $"{id2}_{id1}";
    }

    public async Task<ChatMessageDto> SendMessageAsync(long senderId, long recipientId, string content)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var sender = await dbContext.Users.FindAsync(senderId);
        var recipient = await dbContext.Users.FindAsync(recipientId);

        if (recipient == null)
        {
            throw new KeyNotFoundException($"Recipient with ID {recipientId} was not found.");
        }

        var senderName = sender != null ? $"{sender.Name} {sender.Surname}".Trim() : $"User #{senderId}";
        var recipientName = $"{recipient.Name} {recipient.Surname}".Trim();

        var message = new ChatMessageDto
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            SenderName = senderName,
            RecipientId = recipientId,
            RecipientName = recipientName,
            Content = content,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        var key = GetConversationKey(senderId, recipientId);
        _conversations.AddOrUpdate(
            key,
            _ => new List<ChatMessageDto> { message },
            (_, list) =>
            {
                lock (list)
                {
                    list.Add(message);
                }
                return list;
            });

        return message;
    }

    public Task<List<ChatMessageDto>> GetMessageHistoryAsync(long userId, long otherUserId)
    {
        var key = GetConversationKey(userId, otherUserId);
        if (_conversations.TryGetValue(key, out var list))
        {
            lock (list)
            {
                return Task.FromResult(list.OrderBy(m => m.SentAt).ToList());
            }
        }
        return Task.FromResult(new List<ChatMessageDto>());
    }

    public async Task<List<ConversationSummaryDto>> GetConversationsAsync(long userId)
    {
        var summaries = new List<ConversationSummaryDto>();

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        foreach (var kvp in _conversations)
        {
            List<ChatMessageDto> messages;
            lock (kvp.Value)
            {
                messages = kvp.Value.ToList();
            }

            var userMessages = messages.Where(m => m.SenderId == userId || m.RecipientId == userId).ToList();
            if (!userMessages.Any()) continue;

            var lastMsg = userMessages.OrderByDescending(m => m.SentAt).First();
            long otherUserId = lastMsg.SenderId == userId ? lastMsg.RecipientId : lastMsg.SenderId;

            var otherUser = await dbContext.Users.FindAsync(otherUserId);
            var otherUserName = otherUser != null ? $"{otherUser.Name} {otherUser.Surname}".Trim() : $"User #{otherUserId}";
            var otherUserProfileImg = otherUser?.ProfileImg;

            int unreadCount = userMessages.Count(m => m.RecipientId == userId && !m.IsRead);

            summaries.Add(new ConversationSummaryDto
            {
                OtherUserId = otherUserId,
                OtherUserName = otherUserName,
                OtherUserProfileImg = otherUserProfileImg,
                LastMessage = lastMsg.Content,
                LastMessageAt = lastMsg.SentAt,
                LastMessageSenderId = lastMsg.SenderId,
                UnreadCount = unreadCount
            });
        }

        return summaries.OrderByDescending(s => s.LastMessageAt).ToList();
    }

    public Task MarkMessagesAsReadAsync(long userId, long otherUserId)
    {
        var key = GetConversationKey(userId, otherUserId);
        if (_conversations.TryGetValue(key, out var list))
        {
            lock (list)
            {
                foreach (var msg in list.Where(m => m.RecipientId == userId && !m.IsRead))
                {
                    msg.IsRead = true;
                }
            }
        }
        return Task.CompletedTask;
    }

    public Task<int> GetTotalUnreadCountAsync(long userId)
    {
        int count = 0;
        foreach (var kvp in _conversations)
        {
            lock (kvp.Value)
            {
                count += kvp.Value.Count(m => m.RecipientId == userId && !m.IsRead);
            }
        }
        return Task.FromResult(count);
    }
}
