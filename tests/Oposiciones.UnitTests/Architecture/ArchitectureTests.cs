using NetArchTest.Rules;
using Xunit;

namespace Oposiciones.UnitTests.Architecture;

public sealed class ArchitectureTests
{
    private static readonly System.Reflection.Assembly DomainAssembly = typeof(Domain.Entities.StudyQuestion).Assembly;
    private static readonly System.Reflection.Assembly ApplicationAssembly = typeof(Application.DependencyInjection).Assembly;
    private static readonly System.Reflection.Assembly InfrastructureAssembly = typeof(Infrastructure.DependencyInjection).Assembly;
    private static readonly System.Reflection.Assembly ApiAssembly = typeof(Api.Controllers.AuthController).Assembly;

    [Fact]
    public void DomainMustNotHaveDependencyOnOtherProjects()
    {
        var result = Types.InAssembly(DomainAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "Oposiciones.Application",
                "Oposiciones.Infrastructure",
                "Oposiciones.Api")
            .GetResult();

        Assert.True(result.IsSuccessful, "Domain must not depend on Application, Infrastructure, or Api layers.");
    }

    [Fact]
    public void ApplicationMustNotDependOnInfrastructureOrApi()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "Oposiciones.Infrastructure",
                "Oposiciones.Api")
            .GetResult();

        Assert.True(result.IsSuccessful, "Application must not depend on Infrastructure or Api layers.");
    }

    [Fact]
    public void DomainEntitiesMustNotDependOnEntityFrameworkOrAspNetCore()
    {
        var result = Types.InAssembly(DomainAssembly)
            .That()
            .ResideInNamespace("Oposiciones.Domain.Entities")
            .ShouldNot()
            .HaveDependencyOnAny("Microsoft.EntityFrameworkCore", "Microsoft.AspNetCore")
            .GetResult();

        Assert.True(result.IsSuccessful, "Domain entities must remain POCOs without EF Core or ASP.NET Core dependencies.");
    }

    [Fact]
    public void InfrastructureMustNotDependOnApi()
    {
        var result = Types.InAssembly(InfrastructureAssembly)
            .ShouldNot()
            .HaveDependencyOn("Oposiciones.Api")
            .GetResult();

        Assert.True(result.IsSuccessful, "Infrastructure must not depend on Api presentation layer.");
    }
}
