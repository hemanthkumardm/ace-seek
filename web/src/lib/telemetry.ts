/**
 * Enterprise Telemetry, Error Logger & Event Analytics for Ace-Seek.
 * Structured JSON output for cloud logging (Datadog, CloudWatch, Sentry, Vercel Logs).
 */

export type LogLevel = "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEvent {
  timestamp: string;
  level: LogLevel;
  event: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class TelemetryLogger {
  private formatLog(
    level: LogLevel,
    event: string,
    context?: Record<string, unknown>,
    err?: unknown
  ): LogEvent {
    const payload: LogEvent = {
      timestamp: new Date().toISOString(),
      level,
      event,
      context,
    };

    if (err) {
      if (err instanceof Error) {
        payload.error = {
          name: err.name,
          message: err.message,
          stack: err.stack,
        };
      } else {
        payload.error = {
          name: "UnknownError",
          message: String(err),
        };
      }
    }

    return payload;
  }

  info(event: string, context?: Record<string, unknown>) {
    const log = this.formatLog("INFO", event, context);
    console.log(JSON.stringify(log));
  }

  warn(event: string, context?: Record<string, unknown>) {
    const log = this.formatLog("WARN", event, context);
    console.warn(JSON.stringify(log));
  }

  error(event: string, context?: Record<string, unknown>, err?: unknown) {
    const log = this.formatLog("ERROR", event, context, err);
    console.error(JSON.stringify(log));
  }

  fatal(event: string, context?: Record<string, unknown>, err?: unknown) {
    const log = this.formatLog("FATAL", event, context, err);
    console.error(JSON.stringify(log));
  }

  /**
   * Track high-level product analytics event (e.g. checkout_started, key_issued, timing_analyzed)
   */
  trackAnalytics(eventName: string, properties?: Record<string, unknown>) {
    this.info(`analytics.${eventName}`, properties);
  }
}

export const logger = new TelemetryLogger();
