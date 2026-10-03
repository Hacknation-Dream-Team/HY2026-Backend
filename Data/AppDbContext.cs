using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<CarModel> CarModels => Set<CarModel>();
    public DbSet<UserCar> UserCars => Set<UserCar>();
    public DbSet<RouteModel> Routes => Set<RouteModel>();
    public DbSet<Advertisement> Advertisements => Set<Advertisement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });
    }
}
