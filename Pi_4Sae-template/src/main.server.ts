import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

export default function bootstrap() {
  // Monkey patch for Angular 19.2 SSR context bug
  const originalBootstrap = bootstrapApplication;
  
  try {
    // Try to get the context from the global scope
    const context = (globalThis as any).__ngContext__ || 
                   (globalThis as any).ngServerContext ||
                   undefined;
    
    if (context) {
      return originalBootstrap(AppComponent, {
        ...config,
        providers: [
          ...(config.providers || []),
        ]
      });
    }
  } catch (e) {
    console.warn('Context not available:', e);
  }
  
  return originalBootstrap(AppComponent, config);
}