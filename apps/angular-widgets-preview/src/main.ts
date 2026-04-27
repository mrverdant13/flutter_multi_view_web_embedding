import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((err: unknown) => {
  console.error('[angular-widgets-preview]', err);
});
