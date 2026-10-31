(async () => {
  const base = 'http://localhost:4000';
  const timeout = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitForHealth(retries = 30, delay = 500) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(`${base}/api/health`);
        if (res.ok) return true;
      } catch (e) {
        // ignore
      }
      await timeout(delay);
    }
    return false;
  }

  const healthy = await waitForHealth();
  if (!healthy) {
    console.error('Server did not become healthy in time.');
    process.exit(2);
  }

  const endpoints = ['/api/academic/schools', '/api/academic/programs', '/api/academic/courses'];
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${base}${ep}`, { headers: { Accept: 'application/json' } });
      const text = await res.text();
      console.log(`
=== ${ep} (${res.status}) ===`);
      console.log(text);
    } catch (err) {
      console.error(`Error fetching ${ep}:`, err.message || err);
    }
  }

  process.exit(0);
})();
