import { Injectable, isDevMode } from '@angular/core';

/**
 * Thin wrapper around console logging so call sites don't depend on
 * `console` directly - swap the implementation for a real telemetry sink
 * later without touching callers.
 */
@Injectable({ providedIn: 'root' })
export class Logger {
  debug(message: string, ...args: unknown[]): void {
    if (isDevMode()) {
      console.debug(`[debug] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[info] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[warn] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[error] ${message}`, ...args);
  }
}
