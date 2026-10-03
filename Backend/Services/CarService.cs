using HY2026_Backend.Data;
using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Services;

public class CarService : ICarService
{
    private readonly AppDbContext _context;

    public CarService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CarModelDto>> GetAllCarModelsAsync()
    {
        var models = await _context.CarModels.ToListAsync();
        return models.Select(m => new CarModelDto
        {
            Id = m.Id,
            Brand = m.Brand,
            Model = m.Model,
            FuelType = m.FuelType,
            LPer100km = m.LPer100km,
            KwhPer100km = m.KwhPer100km,
            Co2GKm = m.Co2GKm,
            Seats = m.Seats
        });
    }

    public async Task<UserCarDto> AddUserCarAsync(long userId, CreateUserCarDto createDto)
    {
        var userCar = new UserCar
        {
            UserId = userId,
            BrandId = createDto.BrandId
        };

        _context.UserCars.Add(userCar);
        await _context.SaveChangesAsync();

        await _context.Entry(userCar).Reference(uc => uc.CarModel).LoadAsync();

        return MapToDto(userCar);
    }

    public async Task<IEnumerable<UserCarDto>> GetUserCarsAsync(long userId)
    {
        var cars = await _context.UserCars
            .Include(uc => uc.CarModel)
            .Where(uc => uc.UserId == userId)
            .ToListAsync();

        return cars.Select(MapToDto);
    }

    public async Task<bool> DeleteUserCarAsync(long id, long userId)
    {
        var car = await _context.UserCars
            .FirstOrDefaultAsync(uc => uc.Id == id && uc.UserId == userId);

        if (car == null) return false;

        _context.UserCars.Remove(car);
        await _context.SaveChangesAsync();

        return true;
    }

    private static UserCarDto MapToDto(UserCar userCar)
    {
        return new UserCarDto
        {
            Id = userCar.Id,
            UserId = userCar.UserId,
            BrandId = userCar.BrandId,
            CarModel = userCar.CarModel == null ? null : new CarModelDto
            {
                Id = userCar.CarModel.Id,
                Brand = userCar.CarModel.Brand,
                Model = userCar.CarModel.Model,
                FuelType = userCar.CarModel.FuelType,
                LPer100km = userCar.CarModel.LPer100km,
                KwhPer100km = userCar.CarModel.KwhPer100km,
                Co2GKm = userCar.CarModel.Co2GKm,
                Seats = userCar.CarModel.Seats
            }
        };
    }
}
