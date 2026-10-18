# StockWise API

The API is deliberately small: models are in `src/models`, routes are in `src/routes`, and `server.js` is the startup point. All data is stored in MongoDB.

## Start

1. Copy `.env.example` to `.env` inside `Backend` and set a MongoDB URI and a strong JWT secret.
2. Run `npm install` from the project root.
3. Run `npm run seed` once to add the six catalogue products and an admin account.
4. Run `npm run server`.

The server is available at `http://localhost:5000`. Check the connection with `GET /api/health`.

## Authentication

`POST /api/auth/login` accepts `{ "email", "password" }` and returns a JWT. Send it on protected requests as `Authorization: Bearer <token>`.

The first `POST /api/auth/register` creates an admin only when no users exist. After that, admins can add staff with `POST /api/auth/users`.

## Routes

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Sign in |
| GET | `/api/auth/me` | Signed in | Current user |
| POST | `/api/auth/users` | Admin | Create staff/admin |
| GET | `/api/products?search=&category=&lowStock=true` | Signed in | List/search products |
| POST/PATCH/DELETE | `/api/products` | Admin | Manage products |
| GET | `/api/products/categories` | Signed in | List used categories |
| GET/POST | `/api/orders` | Signed in | View/create purchase orders |
| PATCH | `/api/orders/:id/status` | Admin | Update status; `received` adds ordered quantities to stock once |
| GET | `/api/dashboard/summary` | Signed in | Inventory total, low stock, open orders |

For quick debugging, every request method and path is logged. Error responses are JSON and include a human-readable `message`.
