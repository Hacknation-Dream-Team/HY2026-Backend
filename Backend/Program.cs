using System.Text;
using HY2026_Backend.Data;
using HY2026_Backend.Helpers;
using HY2026_Backend.Models;
using HY2026_Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Controllers & OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Connection string setup (environment variable DATABASE_URL takes priority)
var rawConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection string was not found.");

var parsedConnectionString = ConnectionStringHelper.ParseConnectionString(rawConnectionString);

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(parsedConnectionString, o =>
    {
        o.UseNetTopologySuite();
        o.MapEnum<Weekday>("weekday");
        o.MapEnum<MatchStatus>("match_status");
    }));

// Dependency Injection
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRouteService, RouteService>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<IRideRequestService, RideRequestService>();
builder.Services.AddScoped<IAdvertisementService, AdvertisementService>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<ICarService, CarService>();
builder.Services.AddScoped<IRideService, RideService>();
builder.Services.AddScoped<IAdminService, AdminService>();

// JWT Authentication Configuration
var jwtSecret = builder.Configuration["JwtSettings:Secret"] 
    ?? "SuperSecretKeyForHY2026BackendMustBeAtLeast32BytesLong!";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "HY2026-Backend";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "HY2026-Clients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1)
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Auto-create database tables on startup if they don't exist
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await dbContext.Database.EnsureCreatedAsync();
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'User';");

        // Seed default Admin user if admin@system.local does not exist
        var adminEmail = "admin@system.local";
        var existingAdmin = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
        if (existingAdmin == null)
        {
            var defaultOrg = await dbContext.Organizations.FirstOrDefaultAsync();
            if (defaultOrg == null)
            {
                defaultOrg = new Organization
                {
                    Name = "Default Organization",
                    Location = new NetTopologySuite.Geometries.Point(21.0122, 52.2297) { SRID = 4326 }
                };
                dbContext.Organizations.Add(defaultOrg);
                await dbContext.SaveChangesAsync();
            }

            var adminUser = new User
            {
                OrganizationId = defaultOrg.Id,
                Name = "Admin",
                Surname = "System",
                Email = adminEmail,
                Password = BCrypt.Net.BCrypt.HashPassword("AdminHaslo123!"),
                Role = HY2026_Backend.Helpers.UserRoles.Admin
            };
            dbContext.Users.Add(adminUser);
            await dbContext.SaveChangesAsync();
        }
        else if (existingAdmin.Role != HY2026_Backend.Helpers.UserRoles.Admin)
        {
            existingAdmin.Role = HY2026_Backend.Helpers.UserRoles.Admin;
            await dbContext.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error initializing database.");
    }
}

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }
