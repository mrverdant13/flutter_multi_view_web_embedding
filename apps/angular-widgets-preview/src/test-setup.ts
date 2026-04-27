import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

// jsdom does not implement performance.mark; stub it globally so tests that
// exercise code paths calling performance.mark do not crash.
if (typeof performance === 'undefined') {
  (globalThis as Record<string, unknown>)['performance'] = {};
}
if (typeof performance.mark !== 'function') {
  (performance as Record<string, unknown>)['mark'] = () => {};
}

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
  { teardown: { destroyAfterEach: true } },
);
