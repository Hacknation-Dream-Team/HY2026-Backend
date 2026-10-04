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
    public DbSet<RideEvent> RideEvents => Set<RideEvent>();
    public DbSet<MatchResultDto> MatchResults => Set<MatchResultDto>();
    public DbSet<RouteStop> RouteStops => Set<RouteStop>();
    public DbSet<RideStatus> RideStatuses => Set<RideStatus>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresEnum<Weekday>("weekday");
        modelBuilder.HasPostgresEnum<TripDirection>("trip_direction");
        modelBuilder.HasPostgresEnum<MatchStatus>("match_status");
        modelBuilder.HasPostgresEnum<RideEventType>("ride_event_type");
        modelBuilder.HasPostgresEnum<UserGender>("user_gender");

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<UserCar>(entity =>
        {
            entity.HasOne(uc => uc.CarModel)
                  .WithMany()
                  .HasForeignKey(uc => uc.CarModelId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RouteModel>(entity =>
        {
            entity.HasIndex(r => new { r.UserId, r.Direction }).IsUnique();
        });

        modelBuilder.Entity<RideRequest>(entity =>
        {
            entity.HasIndex(rr => new { rr.UserId, rr.Direction }).IsUnique();
        });

        modelBuilder.Entity<RoutePoint>(entity =>
        {
            entity.HasKey(rp => new { rp.RouteId, rp.Seq });
            entity.HasOne(rp => rp.Route)
                  .WithMany(r => r.Points)
                  .HasForeignKey(rp => rp.RouteId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MatchResultDto>(entity =>
        {
            entity.HasNoKey();
        });

        modelBuilder.Entity<RouteStop>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("route_stops");
        });

        modelBuilder.Entity<RideStatus>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("ride_status");
        });
    }
}
