# RAGnostic Admin

A modern multi-tenant admin dashboard for managing users, tenants, documents, and chat sessions, built with React 18, TypeScript, Vite, and Tailwind CSS.

---

## Features
- **Multi-tenant support**: Manage multiple organizations and their users.
- **JWT Authentication**: Secure login and protected routes.
- **Document Management**: Upload, view, and manage documents per tenant.
- **Chat Sessions**: Multi-session chat UI with streaming assistant responses.
- **User & Tenant Management**: Admin interfaces for users and tenants.
- **Dark/Light Theme**: Toggleable, persistent theme.
- **Responsive UI**: Works on desktop and mobile.

---

## Getting Started

### 1. **Clone the repository**
```sh
git clone https://github.com/your-username/ragnostic-admin.git
cd ragnostic-admin
```

### 2. **Install dependencies**
```sh
npm install
```

### 3. **Environment Variables**
Create a `.env` file in the root directory. Example:
```
VITE_API_URL=http://localhost:3001/api
```
> **Note:** Never commit your `.env` file. See `.gitignore`.

### 4. **Run the development server**
```sh
npm run dev
```

### 5. **Build for production**
```sh
npm run build
```

### 6. **Preview production build**
```sh
npm run preview
```

---

## Project Structure
```
├── public/                # Static assets
├── src/
│   ├── api/               # API clients (auth, users, tenants, documents, chat)
│   ├── components/        # Reusable UI components
│   ├── context/           # React context (auth, theme)
│   ├── pages/             # App pages (Dashboard, Users, Tenants, Documents, Chat)
│   ├── types/             # TypeScript types
│   ├── assets/            # Images and icons
│   └── main.tsx           # App entry point
├── .env                   # Environment variables (not committed)
├── .gitignore             # Git ignore rules
├── package.json           # NPM scripts and dependencies
├── tailwind.config.js     # Tailwind CSS config
├── vite.config.ts         # Vite config
└── README.md              # This file
```

---

## Environment & Secrets
- **Never commit your `.env` file or secrets.**
- Store API keys, DB credentials, and other secrets in `.env` (local) and GitHub Secrets (for CI/CD).

---

## Deployment
- Build the app with `npm run build`.
- Deploy the `dist/` folder to your static hosting (Vercel, Netlify, S3, etc).
- Set environment variables in your hosting provider.

---

## Contributing
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## License
MIT

---

## Contact
For questions or support, open an issue or contact the maintainer.
