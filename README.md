# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Features

This application provides management interfaces for Clients and Networks with full CRUD operations:

### Client Management (`/clients`)
- View all clients with pagination
- Add new clients with name validation
- Edit existing client names
- Delete clients with confirmation
- Error handling for duplicate names and API failures

### Network Management (`/networks`)
- View all networks with pagination
- Add new networks with optional IPv4 addresses
- Edit existing network IPv4 addresses
- Delete networks with confirmation
- Error handling for validation and API failures

### API Configuration

The application connects to a FastAPI backend service. Configure the API base URL by creating a `.env` file:

```bash
cp .env.example .env
```

Then edit the `VITE_API_BASE_URL` variable to point to your backend service (default: `http://localhost:8000`).

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run preview` - Preview production build

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
