namespace HY2026_Backend.DTOs;

public class ChatMessageDto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public long SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public long RecipientId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
}

public class SendMessageDto
{
    public long RecipientId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class ConversationSummaryDto
{
    public long OtherUserId { get; set; }
    public string OtherUserName { get; set; } = string.Empty;
    public string? OtherUserProfileImg { get; set; }
    public string LastMessage { get; set; } = string.Empty;
    public DateTime LastMessageAt { get; set; }
    public long LastMessageSenderId { get; set; }
    public int UnreadCount { get; set; }
}

public class UnreadCountDto
{
    public int TotalUnreadCount { get; set; }
}
