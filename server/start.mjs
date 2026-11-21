process.env.LUCKYSTAR_HOST ||= '0.0.0.0';
process.env.LUCKYSTAR_PORT ||= '5102';
await import('./index.mjs');
