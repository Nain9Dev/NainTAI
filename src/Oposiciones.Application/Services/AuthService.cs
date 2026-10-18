using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Oposiciones.Application.DTOs;
using Oposiciones.Application.Interfaces;
using Oposiciones.Application.Interfaces.Security;
using Oposiciones.Domain.Constants;
using Oposiciones.Domain.Entities;
using Oposiciones.Domain.Interfaces;

namespace Oposiciones.Application.Services;

public sealed class AuthService : IAuthService
{
    private const int DefaultAccessTokenMinutes = 60;
    private const int DefaultRefreshTokenDays = 7;
    private const int RefreshTokenBytes = 64;

    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IConfiguration _config;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUsuarioRepository usuarioRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IConfiguration config,
        IPasswordHasher passwordHasher,
        ILogger<AuthService> logger)
    {
        _usuarioRepository = usuarioRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _config = config;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<AuthResult?> RegisterAsync(
        string nombre, string email, string password, CancellationToken cancellationToken = default)
    {
        var usuario = new Usuario
        {
            Nombre = nombre.Trim(),
            Email = NormalizeEmail(email),
            PasswordHash = _passwordHasher.HashPassword(password),
            Rol = RoleConstants.User,
            FechaRegistro = DateTime.UtcNow
        };

        // La unicidad la resuelve la base de datos: no queda ventana entre comprobar e insertar.
        var newId = await _usuarioRepository.CreateAsync(usuario, cancellationToken);
        if (newId is null)
        {
            return null;
        }

        usuario.Id = newId.Value;
        return await IssueAsync(usuario, cancellationToken);
    }

    public async Task<AuthResult?> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.GetByEmailAsync(NormalizeEmail(email), cancellationToken);

        if (usuario is null)
        {
            // Se calcula un hash desechable para que el coste de un login fallido sea similar
            // exista o no la cuenta, y no se pueda enumerar usuarios midiendo tiempos.
            _ = _passwordHasher.HashPassword(password);
            return null;
        }

        if (!_passwordHasher.VerifyPassword(password, usuario.PasswordHash))
        {
            return null;
        }

        return await IssueAsync(usuario, cancellationToken);
    }

    public async Task<AuthResult?> RefreshTokenAsync(string oldRefreshToken, CancellationToken cancellationToken = default)
    {
        var stored = await _refreshTokenRepository.GetByTokenAsync(oldRefreshToken, cancellationToken);
        if (stored is null)
        {
            return null;
        }

        if (stored.IsRevoked)
        {
            // Un token ya rotado que vuelve a presentarse indica que la cadena esta comprometida:
            // se invalidan todas las sesiones del usuario y se obliga a iniciar sesion de nuevo.
            _logger.LogWarning(
                "Reutilizacion de refresh token detectada para el usuario {UsuarioId}. Se revocan todas sus sesiones.",
                stored.UsuarioId);

            await _refreshTokenRepository.RevokeAllUserTokensAsync(stored.UsuarioId, cancellationToken);
            return null;
        }

        if (stored.IsExpired)
        {
            return null;
        }

        var usuario = await _usuarioRepository.GetByIdAsync(stored.UsuarioId, cancellationToken);
        if (usuario is null)
        {
            return null;
        }

        var issued = await IssueAsync(usuario, cancellationToken);
        await _refreshTokenRepository.RevokeTokenAsync(oldRefreshToken, issued.RefreshToken, cancellationToken);

        return issued;
    }

    public Task RevokeRefreshTokenAsync(string token, CancellationToken cancellationToken = default) =>
        _refreshTokenRepository.RevokeTokenAsync(token, null, cancellationToken);

    private async Task<AuthResult> IssueAsync(Usuario usuario, CancellationToken cancellationToken)
    {
        var sessionId = Guid.NewGuid().ToString("N");
        var accessExpiresAt = DateTime.UtcNow.AddMinutes(AccessTokenMinutes);
        var refreshExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays);

        var accessToken = GenerateJwtToken(usuario, sessionId, accessExpiresAt);
        var refreshToken = GenerateRefreshTokenValue();

        await _refreshTokenRepository.CreateAsync(
            new RefreshToken
            {
                Token = refreshToken,
                UsuarioId = usuario.Id,
                ExpiresAt = refreshExpiresAt,
                CreatedAt = DateTime.UtcNow
            },
            cancellationToken);

        return new AuthResult(
            accessToken,
            refreshToken,
            sessionId,
            accessExpiresAt,
            refreshExpiresAt,
            new AuthenticatedUser(usuario.Id, usuario.Nombre, usuario.Email, usuario.Rol));
    }

    private int AccessTokenMinutes =>
        _config.GetValue<int?>("Jwt:AccessTokenMinutes") is { } minutes && minutes > 0
            ? minutes
            : DefaultAccessTokenMinutes;

    private int RefreshTokenDays =>
        _config.GetValue<int?>("Jwt:RefreshTokenDays") is { } days && days > 0
            ? days
            : DefaultRefreshTokenDays;

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static string GenerateRefreshTokenValue() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(RefreshTokenBytes));

    private string GenerateJwtToken(Usuario usuario, string sessionId, DateTime expiresAt)
    {
        var jwtKey = _config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("La clave JWT no esta configurada.");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString(System.Globalization.CultureInfo.InvariantCulture)),
            // jti identifica la sesion: el token CSRF se guarda por sesion y no por usuario,
            // de modo que iniciar sesion en un segundo dispositivo no invalida el primero.
            new Claim(JwtRegisteredClaimNames.Jti, sessionId),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(ClaimTypes.Name, usuario.Nombre),
            new Claim(ClaimTypes.Role, usuario.Rol)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "OposicionesTAI",
            audience: _config["Jwt:Audience"] ?? "OposicionesTAIUsers",
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
