# Template Electron App

Professional, production-ready Electron application template featuring a modern tech stack and best practices.

## Usage

This is a CLI tool to bootstrap a new Electron application.

### Scaffold a new project

Use `npx` (recommended) to create a new project in seconds:

```bash
npx @khanhromvn/create-electron-app
```

Then follow the interactive prompts to set up your project name.

After scaffolding:

```bash
cd <your-project-name>
npm install
npm run dev
```

## Features

- 🏗 **Architecture**: Feature-based folder structure for scalability.
- ⚡ **Tech Stack**: Electron, React, TypeScript, Vite.
- 🎨 **Styling**: TailwindCSS with shadcn/ui integration.
- 🎭 **Theming**: Advanced theme system with presets (Light/Dark/System).
- 🧪 **Testing**: Vitest ready for Unit and Integration tests.
- 🧹 **Code Quality**: ESLint, Prettier, Husky, lint-staged.
- 📦 **Build**: efficient build process with electron-builder.

## Project Structure

```bash
src/
├── main/           # Main process
│   ├── core/       # Core logic (WindowManager, Config)
│   ├── features/   # Main process features
│   └── index.ts    # Entry point
├── preload/        # Preload scripts
│   ├── api/        # Exposed APIs
│   └── index.ts    # Entry point
└── renderer/       # Renderer process (React)
    ├── src/
    │   ├── core/       # Core providers, routes, theme
    │   ├── features/   # Feature modules (Dashboard, etc)
    │   ├── shared/     # Shared components, hooks, utils
    │   ├── assets/     # Static assets
    │   └── main.tsx    # Entry point
```

## Development (Contributing)

If you want to contribute to this template or run it locally as a standalone app:

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

## Scripts

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm test`: Run tests.
- `npm run lint`: Lint code.
- `npm run format`: Format code.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Setup](./docs/SETUP.md)
- [Development](./docs/DEVELOPMENT.md)
- [Dependencies](./docs/DEPENDENCIES.md)

## Contributing

Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

MIT

Linux, Chrome 147, Auto Language & TimeZone, 1920x1080
