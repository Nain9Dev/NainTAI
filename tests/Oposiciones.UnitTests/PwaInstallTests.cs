using System.Buffers.Binary;
using System.Text.Json;
using System.Text.RegularExpressions;
using Xunit;

namespace Oposiciones.UnitTests;

/// <summary>
/// REQ-081 to REQ-084: the web client is installable on Android and iOS. The client has no test
/// step in CI, so this suite (which CI does run) reads the files Vite publishes from
/// <c>Tai.Client/public</c> and the static shell <c>Tai.Client/index.html</c>. Icon opacity and
/// the maskable safe zone are checked by the install verification script, not here.
/// </summary>
public sealed class PwaInstallTests
{
    private static readonly string ClientRoot = FindClientRoot();

    private static string FindClientRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !Directory.Exists(Path.Combine(directory.FullName, "Tai.Client", "public")))
        {
            directory = directory.Parent;
        }

        return directory is null
            ? throw new DirectoryNotFoundException("Tai.Client/public was not found above the test binaries.")
            : Path.Combine(directory.FullName, "Tai.Client");
    }

    private static JsonElement ReadManifest()
    {
        var path = Path.Combine(ClientRoot, "public", "manifest.webmanifest");
        Assert.True(File.Exists(path), "public/manifest.webmanifest must exist");
        return JsonDocument.Parse(File.ReadAllText(path)).RootElement;
    }

    private static string ReadShell() => File.ReadAllText(Path.Combine(ClientRoot, "index.html"));

    [Fact]
    public void Manifest_names_the_app_and_opens_it_standalone_from_the_root()
    {
        var manifest = ReadManifest();

        Assert.Equal("NainTAI · Simulacros TAI", manifest.GetProperty("name").GetString());
        Assert.Equal("NainTAI", manifest.GetProperty("short_name").GetString());
        Assert.Equal("es", manifest.GetProperty("lang").GetString());
        Assert.Equal("ltr", manifest.GetProperty("dir").GetString());
        Assert.Equal("/", manifest.GetProperty("id").GetString());
        Assert.Equal("/", manifest.GetProperty("start_url").GetString());
        Assert.Equal("/", manifest.GetProperty("scope").GetString());
        Assert.Equal("standalone", manifest.GetProperty("display").GetString());
        Assert.Equal("#090a0f", manifest.GetProperty("theme_color").GetString());
        Assert.Equal("#090a0f", manifest.GetProperty("background_color").GetString());
        Assert.False(manifest.TryGetProperty("prefer_related_applications", out _));

        var description = Regex.Match(ReadShell(), "<meta\\s+name=\"description\"\\s+content=\"([^\"]+)\"").Groups[1].Value;
        Assert.Equal(description, manifest.GetProperty("description").GetString());
    }

    [Fact]
    public void Manifest_declares_192_and_512_icons_and_a_maskable_one_each_at_its_real_size()
    {
        var icons = ReadManifest().GetProperty("icons").EnumerateArray()
            .Select(icon => (
                Src: icon.GetProperty("src").GetString()!,
                Sizes: icon.GetProperty("sizes").GetString()!,
                Type: icon.GetProperty("type").GetString()!,
                Purpose: icon.GetProperty("purpose").GetString()!))
            .ToArray();

        Assert.Equal(
            new[]
            {
                ("/icons/icon-192.png", "192x192", "image/png", "any"),
                ("/icons/icon-512.png", "512x512", "image/png", "any"),
                ("/icons/icon-maskable-512.png", "512x512", "image/png", "maskable"),
            },
            icons);

        foreach (var icon in icons)
        {
            Assert.Equal(icon.Sizes, PngSize(icon.Src));
        }
    }

    [Fact]
    public void Apple_touch_icon_is_a_180_pixel_png()
    {
        Assert.Equal("180x180", PngSize("/icons/apple-touch-icon.png"));
    }

    [Fact]
    public void Static_shell_links_the_manifest_and_carries_the_ios_tags()
    {
        var shell = ReadShell();

        Assert.Single(Regex.Matches(shell, "<link\\s+rel=\"manifest\"\\s+href=\"/manifest\\.webmanifest\""));
        Assert.Single(Regex.Matches(shell, "<link\\s+rel=\"apple-touch-icon\"\\s+href=\"/icons/apple-touch-icon\\.png\""));
        AssertMeta(shell, "mobile-web-app-capable", "yes");
        AssertMeta(shell, "apple-mobile-web-app-capable", "yes");
        AssertMeta(shell, "apple-mobile-web-app-title", "NainTAI");
        AssertMeta(shell, "apple-mobile-web-app-status-bar-style", "black");
        AssertMeta(shell, "theme-color", "#090a0f");
    }

    private static void AssertMeta(string html, string name, string content) =>
        Assert.Single(Regex.Matches(html, $"<meta\\s+name=\"{name}\"\\s+content=\"{content}\""));

    /// <summary>Reads width and height from the PNG IHDR chunk (bytes 16 to 23, big endian).</summary>
    private static string PngSize(string publishedPath)
    {
        var path = Path.Combine(ClientRoot, "public", publishedPath.TrimStart('/'));
        Assert.True(File.Exists(path), $"{publishedPath} must exist");
        var header = File.ReadAllBytes(path).AsSpan(0, 24);
        Assert.True(header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }), $"{publishedPath} must be a PNG");
        var width = BinaryPrimitives.ReadUInt32BigEndian(header[16..20]);
        var height = BinaryPrimitives.ReadUInt32BigEndian(header[20..24]);
        return $"{width}x{height}";
    }
}
