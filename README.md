# CFF Planning Poker

## Description

CFF Planning Poker is an Agile estimation tool built with React, TypeScript, and Vite. It allows teams to conduct estimation sessions using planning poker, enhancing collaboration and improving estimation accuracy.

## Technologies Used

- **Frontend:**
  - React
  - TypeScript
  - Vite
  - Material UI
  - Socket.IO Client
- **Backend:**
  - Node.js
  - Express
  - TypeScript
  - Socket.IO
- **Package Manager:**
  - pnpm

## Features

- Create and join estimation rooms.
- Real-time updates with Socket.IO.
- Auto-fill Room ID when joining via invite link.
- Vote anonymously and reveal votes when ready.
- Reset votes and toggle vote visibility.
- Responsive design with Material UI components.

## Prerequisites

- **Node.js** (version 14 or higher)
- **pnpm** (package manager)

### Installing pnpm

```bash
npm install -g pnpm
```

## Environment Variables

### Frontend (`frontend/.env`)

Create a `.env` file in the `frontend` directory with the following content:

```env
VITE_SOCKET_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:5173
```

- `VITE_SOCKET_URL`: URL where your backend Socket.IO server is running.
- `VITE_FRONTEND_URL`: URL where your frontend application is running.

### Backend (`backend/.env`)

Create a `.env` file in the `backend` directory with the following content:

```env
FRONTEND_URL=http://localhost:5173
```

- `FRONTEND_URL`: URL where your frontend application is running.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Keyurx11/Agile-Poker-Tool.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd Agile-Poker-Tool
   ```

3. **Install dependencies:**

   ```bash
   # Install root dependencies
   pnpm install

   # Install frontend dependencies
   cd frontend
   pnpm install

   # Install backend dependencies
   cd ../backend
   pnpm install

   # Return to project root
   cd ..
   ```

## Running the Application

### Development Mode

1. **Start both backend and frontend servers concurrently:**

   ```bash
   pnpm run dev
   ```

2. **Access the application:**

   Open your browser and navigate to `http://localhost:5173`.

### Build for Production

1. **Build the frontend and backend:**

   ```bash
   pnpm run build
   ```

2. **Start the backend server:**

   ```bash
   pnpm run start
   ```

   - The backend server will run from the `backend/dist` directory.

3. **Serve the frontend build (optional):**

   You can serve the built frontend using a static server or configure your backend to serve the static files.

## Scripts

### Root Scripts (`package.json` in root directory)

- **Start Development Servers:**

  ```bash
  pnpm run dev
  ```

  - Runs both frontend and backend in development mode with hot reloading.

- **Build Project:**

  ```bash
  pnpm run build
  ```

  - Builds both frontend and backend for production.

- **Start Backend Server:**

  ```bash
  pnpm run start
  ```

  - Starts the backend server from the built files.

### Frontend Scripts (`frontend/package.json`)

- **Start Frontend Development Server:**

  ```bash
  pnpm run dev
  ```

- **Build Frontend:**

  ```bash
  pnpm run build
  ```

- **Preview Frontend Production Build:**

  ```bash
  pnpm run preview
  ```

### Backend Scripts (`backend/package.json`)

- **Start Backend Development Server:**

  ```bash
  pnpm run dev
  ```

- **Build Backend:**

  ```bash
  pnpm run build
  ```

- **Start Backend Server:**

  ```bash
  pnpm run start
  ```

## Deployment

When deploying to a platform like Render or Heroku, ensure you set the environment variables accordingly.

### Environment Variables for Deployment

- **Frontend Service:**

  - `VITE_SOCKET_URL`: URL of your deployed backend service.
  - `VITE_FRONTEND_URL`: URL of your deployed frontend service.

- **Backend Service:**

  - `FRONTEND_URL`: URL of your deployed frontend service.

### Notes for Deployment

- Update the CORS configuration in the backend to allow requests from your frontend URL.
- Ensure the invite link in the application uses the correct frontend URL.

## Known Issues

- **Routing Issue:** Refreshing the page or manually entering a URL may cause routing issues due to the use of client-side routing with React Router. This can be resolved by configuring the server to serve the `index.html` file for all routes (e.g., using a fallback in your server or deployment platform).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or new features.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by agile teams needing efficient estimation tools.
- Built with the help of open-source libraries and the developer community.

---

**Enjoy planning your sprints with CFF Planning Poker!**