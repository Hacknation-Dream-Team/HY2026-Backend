using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using HY2026_Backend.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HY2026_Backend.Tests;

public class ChatIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ChatIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ChatFlow_SendGetReadMessages_WorksSuccessfully()
    {
        var client = _factory.CreateClient();

        // 1. Create User 1
        var user1Email = $"chat.user1.{Guid.NewGuid():N}@example.com";
        var user1Reg = await client.PostAsJsonAsync("/api/users", new CreateUserDto
        {
            Name = "Alice",
            Surname = "Smith",
            Email = user1Email,
            Password = "Password123!"
        });
        var auth1 = await user1Reg.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth1);

        // 2. Create User 2
        var user2Email = $"chat.user2.{Guid.NewGuid():N}@example.com";
        var user2Reg = await client.PostAsJsonAsync("/api/users", new CreateUserDto
        {
            Name = "Bob",
            Surname = "Jones",
            Email = user2Email,
            Password = "Password123!"
        });
        var auth2 = await user2Reg.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth2);

        var client1 = _factory.CreateClient();
        client1.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth1.Token);

        var client2 = _factory.CreateClient();
        client2.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth2.Token);

        // User 2 initially has 0 unread messages
        var unreadInitial = await client2.GetFromJsonAsync<UnreadCountDto>("/api/chat/unread-count");
        Assert.NotNull(unreadInitial);

        // 3. User 1 sends message to User 2
        var sendRes = await client1.PostAsJsonAsync("/api/chat/messages", new SendMessageDto
        {
            RecipientId = auth2.User.Id,
            Content = "Hej Bob, czy jedziesz dzisiaj o 8:00?"
        });
        Assert.Equal(HttpStatusCode.OK, sendRes.StatusCode);
        var sentMsg = await sendRes.Content.ReadFromJsonAsync<ChatMessageDto>();
        Assert.NotNull(sentMsg);
        Assert.Equal(auth1.User.Id, sentMsg.SenderId);
        Assert.Equal(auth2.User.Id, sentMsg.RecipientId);
        Assert.Equal("Hej Bob, czy jedziesz dzisiaj o 8:00?", sentMsg.Content);

        // 4. User 2 checks unread count -> should be > 0
        var unreadAfterSend = await client2.GetFromJsonAsync<UnreadCountDto>("/api/chat/unread-count");
        Assert.NotNull(unreadAfterSend);
        Assert.True(unreadAfterSend.TotalUnreadCount >= 1);

        // 5. User 2 gets conversations summary
        var conversations = await client2.GetFromJsonAsync<List<ConversationSummaryDto>>("/api/chat/conversations");
        Assert.NotNull(conversations);
        Assert.Contains(conversations, c => c.OtherUserId == auth1.User.Id && c.LastMessage == "Hej Bob, czy jedziesz dzisiaj o 8:00?");

        // 6. User 2 gets history with User 1
        var history = await client2.GetFromJsonAsync<List<ChatMessageDto>>($"/api/chat/messages/{auth1.User.Id}");
        Assert.NotNull(history);
        Assert.Single(history);
        Assert.Equal("Hej Bob, czy jedziesz dzisiaj o 8:00?", history[0].Content);

        // 7. User 2 marks messages as read
        var readRes = await client2.PostAsync($"/api/chat/read/{auth1.User.Id}", null);
        Assert.Equal(HttpStatusCode.OK, readRes.StatusCode);

        // 8. User 2 unread count is now 0 for this chat
        var historyAfterRead = await client2.GetFromJsonAsync<List<ChatMessageDto>>($"/api/chat/messages/{auth1.User.Id}");
        Assert.NotNull(historyAfterRead);
        Assert.True(historyAfterRead.All(m => m.IsRead));
    }
}
