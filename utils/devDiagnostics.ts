/**
 * Development-only performance diagnostics and debugging utilities
 * Only active in __DEV__ mode for performance monitoring during development
 */
import React from 'react';

interface PerformanceTimer {
  name: string;
  startTime: number;
}

class DevDiagnostics {
  private timers: Map<string, PerformanceTimer> = new Map();
  private renderCounts: Map<string, number> = new Map();

  // Performance timing utilities
  startTimer(name: string): void {
    if (!__DEV__) return;
    
    this.timers.set(name, {
      name,
      startTime: performance.now()
    });
  }

  endTimer(name: string): number {
    if (!__DEV__) return 0;
    
    const timer = this.timers.get(name);
    if (!timer) {
      console.warn(`Timer "${name}" not found`);
      return 0;
    }

    const duration = performance.now() - timer.startTime;
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    this.timers.delete(name);
    
    // Log slow operations
    if (duration > 100) {
      console.warn(`🐌 Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  // Component render counting
  trackRender(componentName: string): void {
    if (!__DEV__) return;
    
    const currentCount = this.renderCounts.get(componentName) || 0;
    const newCount = currentCount + 1;
    this.renderCounts.set(componentName, newCount);
    
    // Warn about excessive renders
    if (newCount > 10 && newCount % 10 === 0) {
      console.warn(`🔄 ${componentName} has rendered ${newCount} times`);
    }
  }

  // Memory usage monitoring
  logMemoryUsage(label: string = 'Memory Usage'): void {
    if (!__DEV__) return;
    
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`🧠 ${label}:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }

  // Bundle size analysis helper
  logBundleInfo(): void {
    if (!__DEV__) return;
    
    console.log('📦 To analyze bundle size, run:');
    console.log('npm run bundle:analyze');
  }

  // Network request timing
  timeAsyncOperation<T>(name: string, operation: Promise<T>): Promise<T> {
    if (!__DEV__) return operation;
    
    this.startTimer(name);
    return operation.finally(() => {
      this.endTimer(name);
    });
  }

  // Clear all diagnostics data
  reset(): void {
    if (!__DEV__) return;
    
    this.timers.clear();
    this.renderCounts.clear();
    console.log('🧹 Dev diagnostics reset');
  }

  // Print diagnostics summary
  printSummary(): void {
    if (!__DEV__) return;
    
    console.log('📊 Performance Summary:');
    console.log('Render counts:', Object.fromEntries(this.renderCounts));
    this.logMemoryUsage('Current Memory');
  }
}

// Export singleton instance
export const devDiagnostics = new DevDiagnostics();

// HOC for automatic render tracking
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>, 
  name?: string
): React.ComponentType<P> {
  if (!__DEV__) return Component;
  
  const componentName = name || Component.displayName || Component.name || 'Unknown';
  
  return function TrackedComponent(props: P) {
    devDiagnostics.trackRender(componentName);
    return React.createElement(Component, props);
  };
}

// Hook for component timing
export function usePerformanceTimer(name: string) {
  if (!__DEV__) return { start: () => {}, end: () => 0 };
  
  return {
    start: () => devDiagnostics.startTimer(name),
    end: () => devDiagnostics.endTimer(name)
  };
}