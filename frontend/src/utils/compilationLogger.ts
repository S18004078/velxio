/**
 * Parse a CompileResult into CompilationLog entries for display in the console.
 */

import type { CompileResult } from '../services/compilation';

export interface CompilationLog {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning' | 'core-install';
  message: string;
}

export function parseCompileResult(result: CompileResult, board: string): CompilationLog[] {
  const logs: CompilationLog[] = [];
  const now = new Date();

  logs.push({ timestamp: now, type: 'info', message: `Compiling for ${board}...` });

  // Core install log
  if (result.core_install_log) {
    for (const line of result.core_install_log.split('\n')) {
      if (line.trim()) {
        logs.push({ timestamp: now, type: 'core-install', message: line });
      }
    }
  }

  // stdout
  if (result.stdout) {
    for (const line of result.stdout.split('\n')) {
      if (line.trim()) {
        const type = line.toLowerCase().includes('warning') ? 'warning' : 'info';
        logs.push({ timestamp: now, type, message: line });
      }
    }
  }

  // stderr — classify lines as warnings or errors
  if (result.stderr) {
    for (const line of result.stderr.split('\n')) {
      if (!line.trim()) continue;
      let type: CompilationLog['type'] = 'error';
      const lower = line.toLowerCase();
      if (lower.includes('warning:') || lower.includes('warn ')) {
        type = 'warning';
      } else if (lower.includes('note:') || lower.includes('in file included') || lower.startsWith('using ') || lower.startsWith('libraries ')) {
        type = 'info';
      }
      logs.push({ timestamp: now, type, message: line });
    }
  }

  // Final status
  if (result.success) {
    logs.push({ timestamp: now, type: 'success', message: '✓ Compilation successful' });
  } else {
    const errorMsg = result.error || 'Compilation failed';
    logs.push({ timestamp: now, type: 'error', message: `✕ ${errorMsg}` });
  }

  return logs;
}
