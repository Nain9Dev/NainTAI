import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import robots from '../../public/robots.txt?raw';
import sitemap from '../../public/sitemap.xml?raw';
import llms from '../../public/llms.txt?raw';

/**
 * REQ-076 to REQ-080: the static shell is what crawlers and AI engines read before any
 * script runs, so its metadata and the root discovery files are pinned here.
 */
const HOST = 'https://tai.naindev.com/';
const REPO = 'https://github.com/Nain9Dev/NainTAI';

function metaContent(attr: 'name' | 'property', key: string): string[] {
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"\\s*/?>`, 'gs');
  return [...indexHtml.matchAll(pattern)].map((m) => (m[1] ?? '').replace(/\s+/g, ' ').trim());
}

describe('static shell metadata', () => {
  it('has exactly one canonical link equal to the host root', () => {
    const links = [...indexHtml.matchAll(/<link\s+rel="canonical"\s+href="([^"]*)"\s*\/?>/g)];
    expect(links).toHaveLength(1);
    expect(links[0]?.[1]).toBe(HOST);
  });

  it('has one description of 70 to 160 characters', () => {
    const descriptions = metaContent('name', 'description');
    expect(descriptions).toHaveLength(1);
    const length = descriptions[0]?.length ?? 0;
    expect(length).toBeGreaterThanOrEqual(70);
    expect(length).toBeLessThanOrEqual(160);
  });

  it('declares Open Graph and Twitter card metadata that agree with the canonical', () => {
    expect(metaContent('property', 'og:type')).toEqual(['website']);
    expect(metaContent('property', 'og:site_name')).toEqual(['Simulacros TAI']);
    expect(metaContent('property', 'og:title')).toHaveLength(1);
    expect(metaContent('property', 'og:description')).toHaveLength(1);
    expect(metaContent('property', 'og:url')).toEqual([HOST]);
    const image = metaContent('property', 'og:image');
    expect(image).toHaveLength(1);
    expect(image[0]).toMatch(/^https:\/\/[^"]+\.(jpg|png|webp)$/);
    expect(metaContent('property', 'og:image:width')).toEqual(['1200']);
    expect(metaContent('property', 'og:image:height')).toEqual(['630']);
    expect(metaContent('name', 'twitter:card')).toEqual(['summary_large_image']);
    expect(metaContent('name', 'twitter:title')).toEqual(metaContent('property', 'og:title'));
    expect(metaContent('name', 'twitter:description')).toEqual(metaContent('property', 'og:description'));
    expect(metaContent('name', 'twitter:image')).toEqual(image);
  });

  it('links the author', () => {
    expect(indexHtml).toMatch(/<link\s+rel="author"\s+href="https:\/\/www\.naindev\.com\/"\s*\/>/);
  });

  it('embeds JSON-LD that parses and references the author by id', () => {
    const blocks = [...indexHtml.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(blocks).toHaveLength(1);
    const raw = blocks[0]?.[1] ?? '';
    expect(raw).not.toContain('<');
    const data = JSON.parse(raw) as Record<string, unknown>;
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('SoftwareApplication');
    expect(data['url']).toBe(HOST);
    expect(data['operatingSystem']).toBe('Web');
    expect(data['isAccessibleForFree']).toBe(true);
    expect(data['inLanguage']).toBe('es');
    expect(typeof data['name']).toBe('string');
    expect(typeof data['description']).toBe('string');
    expect(typeof data['applicationCategory']).toBe('string');
    expect(JSON.stringify(data['sameAs'])).toContain(REPO);
    const author = data['author'] as Record<string, unknown>;
    expect(author['@type']).toBe('Person');
    expect(author['@id']).toBe('https://www.naindev.com/#person');
    expect(author['url']).toBe('https://www.naindev.com/');
  });
});

describe('root discovery files', () => {
  it('robots.txt allows everything and advertises the sitemap', () => {
    expect(robots).toMatch(/^User-agent: \*\r?\nAllow: \/\r?\n/);
    expect(robots).not.toMatch(/Disallow/i);
    expect(robots).toMatch(new RegExp(`^Sitemap: ${HOST}sitemap\\.xml\\s*$`, 'm'));
  });

  it('sitemap.xml lists only the canonical root', () => {
    const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([HOST]);
  });

  it('llms.txt starts with an H1 and a summary and links the repository and the main site', () => {
    expect(llms).toMatch(/^# Simulacros TAI\r?\n/);
    expect(llms).toMatch(/^> .+$/m);
    expect(llms).toContain(REPO);
    expect(llms).toContain('https://www.naindev.com/');
  });
});
