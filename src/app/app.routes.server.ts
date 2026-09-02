import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // The app sits behind auth, so most routes can only be resolved with a
  // token and are rendered per request. The login page has no such
  // dependency and can be prerendered.
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
