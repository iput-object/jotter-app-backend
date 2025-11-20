const winston = require("winston");
const config = require("./config");
require("winston-daily-rotate-file");

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const transport = new winston.transports.DailyRotateFile({
  dirname: "logs", // folder name
  filename: "app-%DATE%.log", // log file name pattern
  datePattern: "YYYY-MM-DD", // daily rotation
  zippedArchive: false, // zip old logs? (optional)
  maxSize: "20m", // rotate if file > 20MB
  maxFiles: "14d", // keep logs for 14 days
});

const logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: winston.format.combine(
    enumerateErrorFormat(),
    config.env === "development"
      ? winston.format.colorize()
      : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }), // Add timestamp format
    winston.format.printf(
      ({ timestamp, level, message }) => `[${level}] ${message}`
    ) // Modify printf format
    //winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`) // Modify printf format
    // winston.format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports: [
    transport,
    new winston.transports.Console(), // Add console output
  ],
});

module.exports = logger;
