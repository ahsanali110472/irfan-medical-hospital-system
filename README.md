## HMS (MERN + Electron)

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI

### Setup
1. Copy `backend/.env.example` to `backend/.env` and fill values.
2. Install root deps and sub-packages:
```
npm install
```
3. Seed demo data:
```
npm run seed
```
4. Start development (backend + frontend + electron):
```
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Build installers
```
npm run dist
```

### Roles
- Admin: full access.
- Receptionist: patients, billing.

### Printing
Renderer can call `window.electronAPI.printHtml(htmlString)` to print bills/closing.

### Branding
Footer shows: Powered by Try Unity Solutions | Email: tryunitysolutions@gmail.com | Contact: 03023476605





