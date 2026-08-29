// PM2 Ecosystem Configuration
// Start:   pm2 start ecosystem.config.js
// Reload:  pm2 reload ecosystem.config.js  (zero-downtime)
// Stop:    pm2 stop all
// Monitor: pm2 monit

module.exports = {
  apps: [
    {
      name: 'incubation-backend',
      script: 'src/server.js',
      cwd: __dirname,

      // ─── CLUSTER MODE ──────────────────────────────────
      // t3.micro has 1GB RAM - running 2 workers (max) causes OOM kills.
      // Use PM2_INSTANCES env var to override (e.g. PM2_INSTANCES=2 on a
      // larger instance). Default to 1 for safety.
      instances: parseInt(process.env.PM2_INSTANCES, 10) || 1,
      exec_mode: 'cluster',

      // ─── RESTART POLICIES ──────────────────────────────
      max_memory_restart: '400M',
      autorestart: true,
      max_restarts: 25,                // was 10 - give more chances before giving up
      restart_delay: 3000,             // 3s delay between restarts (was 1s)
      min_uptime: '30s',               // consider stable after 30s (was 10s)
      exp_backoff_restart_delay: 100,  // exponential backoff: 100ms → 200ms → 400ms → …
      // ^ Prevents crash-loop storms: if the app keeps dying, PM2 waits
      //   progressively longer (up to 15s) before each retry instead of
      //   hammering restarts every second.

      // ─── GRACEFUL SHUTDOWN ─────────────────────────────
      kill_timeout: 5000, // 5s to finish in-flight requests
      listen_timeout: 8000, // 8s to start listening
      shutdown_with_message: true,
      wait_ready: true, // wait for process.send('ready')

      // ─── ENVIRONMENT ──────────────────────────────────
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // ─── LOGGING ───────────────────────────────────────
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      log_type: 'json',

      // ─── WATCHING (dev only) ───────────────────────────
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
    },
  ],
};
