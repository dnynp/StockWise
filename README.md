# StockWise

StockWise is a simple inventory and stock analytics application built for a college project. It helps a small store team keep products organised, find items that need restocking, prepare purchase orders, and understand inventory value.

The project has a React frontend, an Express API, and MongoDB for data storage.

## What it can do

- Secure sign-in for admin, manager, and staff accounts.
- Product search, category filters, pagination, low-stock and out-of-stock views.
- Product add, edit, and delete actions for authorised users.
- Purchase-order drafts and a clear order flow: draft, submitted, approved, received, or cancelled.
- Automatic stock increase when an order is received.
- Dashboard totals for stock value, units, products needing attention, and open orders.
- Analytics charts and category-level inventory details.
- Light and dark modes.

## Project layout

```text
StockWise/
  Frontend/          React and Vite application
  Backend/           Express API, MongoDB models, seed script
  README.md          Project setup and overview
  StockWise_Project_Documentation.docx
```

## Requirements

- Node.js 20 or later
- A MongoDB Atlas database or local MongoDB instance

## Setup

### 1. Configure the backend

Copy `Backend/.env.example` to `Backend/.env`, then add your MongoDB connection string and a strong JWT secret.

```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=a-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
```

Install and seed the database:

```bash
cd Backend
npm install
npm run seed
npm start
```

The API starts at `http://localhost:5000`. Check it with `http://localhost:5000/api/health`.

### 2. Start the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Vite shows the local browser address in the terminal. The API accepts Vite ports 5170 to 5179 during local development.

## Demo accounts

These accounts are for the college demonstration only.

| Name | Role | Login | Password |
| --- | --- | --- | --- |
| Dnyaneshwar | Admin | `dnyaneshwar` or `admin` | `admin` |
| Muskan | Manager | `muskan` or `manager` | `manager` |
| Prajwal | Staff | `prajwal` or `staff` | `staff` |
| Shushant | Staff | `shushant` | `staff` |

## Main API routes

- `POST /api/auth/login` - sign in
- `GET /api/products` - list, search, and filter products
- `POST /api/products` - create a product
- `PATCH /api/products/:id` - update a product
- `DELETE /api/products/:id` - delete a product
- `GET` and `POST /api/orders` - list or create purchase orders
- `PATCH /api/orders/:id/status` - update an order status
- `GET /api/dashboard/summary` - dashboard totals
- `GET /api/dashboard/analytics` - analytics data

## Notes for contributors

- Keep frontend code inside `Frontend` and backend code inside `Backend`.
- Never commit `.env` files, database connection strings, or JWT secrets.
- Run `npm run build` inside `Frontend` after frontend changes.
- Keep permission checks and validation on the server, not only in the UI.
