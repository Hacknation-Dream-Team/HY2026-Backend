using System.Text.Json.Serialization;

namespace HY2026_Backend.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TripDirection
{
    ToWork,
    ToHome
}
