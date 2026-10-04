using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface IAdvertisementService
{
    Task<AdvertisementDto> CreateAdvertisementAsync(long userId, CreateAdvertisementDto createDto);
    Task<IEnumerable<AdvertisementDto>> GetAdvertisementsAsync(long userId);
    Task<AdvertisementDto?> GetAdvertisementAsync(long id, long userId);
    Task<bool> DeleteAdvertisementAsync(long id, long userId);
    Task<AdvertisementDto?> UpdateAdvertisementAsync(long id, long userId, UpdateAdvertisementDto updateDto);
}
