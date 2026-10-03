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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }
