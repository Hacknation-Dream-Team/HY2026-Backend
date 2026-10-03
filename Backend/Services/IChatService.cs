using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IChatService
{
    Task<ChatMessageDto> SendMessageAsync(long senderId, long recipientId, string content);
    Task<List<ChatMessageDto>> GetMessageHistoryAsync(long userId, long otherUserId);
    Task<List<ConversationSummaryDto>> GetConversationsAsync(long userId);
    Task MarkMessagesAsReadAsync(long userId, long otherUserId);
    Task<int> GetTotalUnreadCountAsync(long userId);
}
