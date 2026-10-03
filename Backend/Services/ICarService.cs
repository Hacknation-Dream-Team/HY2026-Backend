using HY2026_Backend.DTOs;

namespace HY2026_Backend.Services;

public interface ICarService
{
    Task<IEnumerable<CarModelDto>> GetAllCarModelsAsync();
    Task<UserCarDto> AddUserCarAsync(long userId, CreateUserCarDto createDto);
    Task<IEnumerable<UserCarDto>> GetUserCarsAsync(long userId);
    Task<bool> DeleteUserCarAsync(long id, long userId);
}
