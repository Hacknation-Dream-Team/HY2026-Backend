using HY2026_Backend.DTOs;
using HY2026_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HY2026_Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<CarModel> CarModels => Set<CarModel>();
    public DbSet<UserCar> UserCars => Set<UserCar>();
    public DbSet<RouteModel> Routes => Set<RouteModel>();
    public DbSet<RoutePoint> RoutePoints => Set<RoutePoint>();
    public DbSet<Advertisement> Advertisements => Set<Advertisement>();
    public DbSet<RideRequest> RideRequests => Set<RideRequest>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Ride> Rides => Set<Ride>();
    public DbSet<MatchResultDto> MatchResults => Set<MatchResultDto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresEnum<Weekday>("weekday");
        modelBuilder.HasPostgresEnum<MatchStatus>("match_status");

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<RoutePoint>(entity =>
        {
            entity.HasKey(rp => new { rp.RouteId, rp.Seq });
            entity.HasOne(rp => rp.Route)
                  .WithMany(r => r.Points)
                  .HasForeignKey(rp => rp.RouteId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Ride>(entity =>
        {
            entity.HasIndex(r => new { r.MatchId, r.RideDate }).IsUnique();
        });

        modelBuilder.Entity<MatchResultDto>(entity =>
        {
            entity.HasNoKey();
        });
    }
}
