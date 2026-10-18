using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Oposiciones.Domain.Entities;
using Oposiciones.Domain.Interfaces;

namespace Oposiciones.Api.Controllers;

/// <summary>
/// Temario oficial. Es contenido estable y publico, por lo que se cachea de forma agresiva
/// tanto en el servidor como en el cliente.
/// </summary>
[ApiController]
[Route("api/syllabus")]
[Produces("application/json")]
public class SyllabusController : ControllerBase
{
    private const string BlocksCacheKey = "syllabus:blocks";
    private const string TopicsCacheKeyPrefix = "syllabus:topics:";
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromHours(24);

    private readonly ISyllabusRepository _syllabusRepository;
    private readonly IDistributedCache _cache;
    private readonly ILogger<SyllabusController> _logger;

    public SyllabusController(
        ISyllabusRepository syllabusRepository,
        IDistributedCache cache,
        ILogger<SyllabusController> logger)
    {
        _syllabusRepository = syllabusRepository;
        _cache = cache;
        _logger = logger;
    }

    [HttpGet("blocks")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType(typeof(IReadOnlyList<SyllabusBlock>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBlocks(CancellationToken cancellationToken)
    {
        var blocks = await GetOrSetAsync(
            BlocksCacheKey,
            () => _syllabusRepository.GetBlocksAsync(cancellationToken),
            cancellationToken);

        return Ok(blocks);
    }

    /// <summary>
    /// Temas del bloque indicado. Sin blockId devuelve el temario completo, de forma que el
    /// cliente pueda construir el arbol con una sola peticion.
    /// </summary>
    [HttpGet("topics")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, VaryByQueryKeys = ["blockId"])]
    [ProducesResponseType(typeof(IReadOnlyList<SyllabusTopic>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopicsByBlock([FromQuery] int? blockId, CancellationToken cancellationToken)
    {
        var topics = await GetOrSetAsync(
            TopicsCacheKeyPrefix + (blockId?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "all"),
            () => _syllabusRepository.GetTopicsByBlockAsync(blockId, cancellationToken),
            cancellationToken);

        return Ok(topics);
    }

    /// <summary>
    /// Lectura con respaldo en cache. Si la cache falla o devuelve datos corruptos se sigue
    /// sirviendo desde base de datos: un fallo de Redis no debe tumbar el endpoint.
    /// </summary>
    private async Task<IReadOnlyList<T>> GetOrSetAsync<T>(
        string cacheKey,
        Func<Task<IReadOnlyList<T>>> loader,
        CancellationToken cancellationToken)
    {
        try
        {
            var cached = await _cache.GetStringAsync(cacheKey, cancellationToken);
            if (!string.IsNullOrEmpty(cached))
            {
                var deserialized = JsonSerializer.Deserialize<List<T>>(cached);
                if (deserialized is not null)
                {
                    return deserialized;
                }
            }
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogWarning(exception, "Fallo al leer la cache de temario ({CacheKey}). Se consulta la base de datos.", cacheKey);
        }

        var fresh = await loader();

        try
        {
            await _cache.SetStringAsync(
                cacheKey,
                JsonSerializer.Serialize(fresh),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheLifetime },
                cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogWarning(exception, "Fallo al escribir la cache de temario ({CacheKey}).", cacheKey);
        }

        return fresh;
    }
}
