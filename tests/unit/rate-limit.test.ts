import { describe, expect, it, vi } from 'vitest';
import { createMemoryRateLimiter, createUpstashRateLimiter, getClientIp, MINUTE } from '@/lib/rate-limit';

const rules = [{ windowMs: MINUTE, max: 3 }];

describe('createMemoryRateLimiter', () => {
  it('allows up to max hits and blocks the next one', async () => {
    const limiter = createMemoryRateLimiter(() => 1_000);
    expect(await limiter.isOverLimit('a', rules)).toBe(false);
    expect(await limiter.isOverLimit('a', rules)).toBe(false);
    expect(await limiter.isOverLimit('a', rules)).toBe(false);
    expect(await limiter.isOverLimit('a', rules)).toBe(true);
  });

  it('keeps keys independent', async () => {
    const limiter = createMemoryRateLimiter(() => 1_000);
    for (let i = 0; i < 4; i++) await limiter.isOverLimit('a', rules);
    expect(await limiter.isOverLimit('b', rules)).toBe(false);
  });

  it('resets after the window passes', async () => {
    let now = 1_000;
    const limiter = createMemoryRateLimiter(() => now);
    for (let i = 0; i < 4; i++) await limiter.isOverLimit('a', rules);
    expect(await limiter.isOverLimit('a', rules)).toBe(true);
    now += MINUTE + 1;
    expect(await limiter.isOverLimit('a', rules)).toBe(false);
  });

  it('applies every rule (a long window can block even when the short one is fine)', async () => {
    let now = 0;
    const limiter = createMemoryRateLimiter(() => now);
    const multi = [
      { windowMs: MINUTE, max: 10 },
      { windowMs: 10 * MINUTE, max: 2 },
    ];
    await limiter.isOverLimit('a', multi);
    now += 2 * MINUTE;
    await limiter.isOverLimit('a', multi);
    now += 2 * MINUTE;
    expect(await limiter.isOverLimit('a', multi)).toBe(true);
  });
});

describe('createUpstashRateLimiter', () => {
  it('sends INCR + PEXPIRE NX per rule and reads the INCR results', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const commands = JSON.parse(String(init.body)) as unknown[][];
      expect(commands).toHaveLength(2);
      expect(commands[0][0]).toBe('INCR');
      expect(commands[1][0]).toBe('PEXPIRE');
      expect(commands[1][3]).toBe('NX');
      return new Response(JSON.stringify([{ result: 4 }, { result: 1 }]), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const limiter = createUpstashRateLimiter('https://example.upstash.io/', 'token', createMemoryRateLimiter());
    expect(await limiter.isOverLimit('a', rules)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('https://example.upstash.io/pipeline', expect.objectContaining({ method: 'POST' }));
    vi.unstubAllGlobals();
  });

  it('falls back to the in-memory limiter when Redis is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fallback = createMemoryRateLimiter(() => 0);
    const limiter = createUpstashRateLimiter('https://example.upstash.io', 'token', fallback);
    for (let i = 0; i < 3; i++) expect(await limiter.isOverLimit('a', rules)).toBe(false);
    expect(await limiter.isOverLimit('a', rules)).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('getClientIp', () => {
  it('prefers platform-set headers', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' });
    expect(getClientIp(headers)).toBe('2.2.2.2');
  });

  it('ignores x-forwarded-for unless TRUST_PROXY is set', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.1.1.1' });
    const previous = process.env.TRUST_PROXY;
    delete process.env.TRUST_PROXY;
    expect(getClientIp(headers)).toBe('unknown');
    process.env.TRUST_PROXY = 'true';
    expect(getClientIp(headers)).toBe('1.1.1.1');
    process.env.TRUST_PROXY = previous;
  });

  it('uses the last hop of x-forwarded-for (the one the proxy appended), not the client-supplied first one', () => {
    process.env.TRUST_PROXY = 'true';
    const headers = new Headers({ 'x-forwarded-for': 'spoofed, 9.9.9.9' });
    expect(getClientIp(headers)).toBe('9.9.9.9');
    delete process.env.TRUST_PROXY;
  });
});
