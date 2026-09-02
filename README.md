# Limb-itless

Frontend for the Limb-itless project - an Angular application (with SSR) generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7.

## Team members

- Siphamandla Malaza
- Jessica Harrison
- Reuben Ellis
- Nkanyiso Shabane

## Branching strategy

This project follows Trunk-Based Development.

All work is based on a single primary branch (`main`), which is always kept in a deployable state. Changes are developed in short-lived branches created from `main` and merged back frequently through pull requests.

This approach promotes:
- Continuous integration and fast feedback
- Reduced merge conflicts
- Smaller, incremental changes

To maintain stability, all changes merged into `main` must pass automated checks and code review before integration.

## Prerequisites

- [Node.js](https://nodejs.org/) - a version compatible with Angular 21 (v20.19+ or v22.12+; check the [Angular version compatibility table](https://angular.dev/reference/versions) if you're on an older install). npm ships with Node, so no separate install is needed.
- The [Angular CLI](https://angular.dev/tools/cli) - optional. You don't need it installed globally; see "Two ways to run commands" below.

## Setup

Clone the repo, then from this folder (`Limb-itless-Tech-Accelerator-FE`) install the dependencies:

```bash
npm install
```

This reads `package.json` and downloads Angular and everything else the project needs into a local `node_modules/` folder (gitignored - you won't see it in git status). Run it once after cloning, and again any time `package.json` changes (e.g. after pulling a branch that added a dependency).

## Two ways to run commands

Every command below (`ng serve`, `ng test`, etc.) can be run two ways - both do exactly the same thing:

1. **Via npm scripts** (recommended) - `npm start`, `npm test`, `npm run build`. These are shortcuts defined in `package.json` that call the Angular CLI version pinned there (`^21.2.7`) straight out of `node_modules/.bin`. They work right after `npm install`, with nothing installed globally, and every teammate uses the same CLI version regardless of what (if anything) they have installed globally.
2. **Via the `ng` CLI directly** - `ng serve`, `ng test`, `ng build`. This only works if the `ng` command is on your PATH, which means either installing the CLI globally (`npm install -g @angular/cli`), or prefixing commands with `npx` (e.g. `npx ng serve`), which reaches into the local install the same way the npm scripts do.

Use whichever you're comfortable with - the commands below show both forms.

## Development server

```bash
npm start        # or: ng serve
```

Open `http://localhost:4200/` once it's running. The app reloads automatically whenever you edit a source file.

## Code scaffolding

Angular CLI includes code scaffolding tools. To generate a new component:

```bash
ng generate component component-name     # or: npx ng generate component component-name
```

For the full list of available schematics (components, services, directives, etc.):

```bash
ng generate --help
```

There's no npm script shortcut for scaffolding - use `ng generate` or `npx ng generate` directly.

## Running unit tests

```bash
npm test          # or: ng test
```

Runs the [Vitest](https://vitest.dev/)-based test runner against every `*.spec.ts` file.

## Building

```bash
npm run build     # or: ng build
```

Compiles the project into `dist/` (gitignored). The default configuration is `production`, which optimizes for performance; pass `--configuration development` for an unoptimized build.

This project has server-side rendering (SSR) configured. To try the built SSR server locally after building:

```bash
npm run serve:ssr:limb-itless
```

That serves the app from `dist/limb-itless/server/server.mjs` on `http://localhost:4000` by default.

## Running end-to-end tests

```bash
ng e2e
```

Angular CLI doesn't include an e2e framework by default, and none is configured for this project yet. Pick one (e.g. Playwright, Cypress) if/when the team needs e2e coverage.

## Additional resources

For more on the Angular CLI, see the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
