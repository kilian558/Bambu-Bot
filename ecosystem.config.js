module.exports = {
  apps: [{
    name: 'bambu-discord-bot',
    script: './bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Restart-Strategie für Fehler
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 5000,
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true
  }]
};
