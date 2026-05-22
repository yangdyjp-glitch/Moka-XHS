const path = require("path");

module.exports = {
  apps: [
    {
      name: "compass",
      script: path.join(__dirname, "server/index.ts"),
      interpreter: "node",
      interpreter_args: "--import tsx/esm",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: path.join(__dirname, "logs/error.log"),
      out_file: path.join(__dirname, "logs/out.log"),
      merge_logs: true,
    },
  ],
};
