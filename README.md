# MariStay

Hotel Management and Digital Guest Services System

MariStay is a web-based system for managing hotel rooms, reservations, guests, payments, digital room keys, housekeeping, and guest service requests.

**Developer:** Geero Andrei E. Reyes

**Section:** BSIT 4C

**Subject:** ITEC 116 - Systems Integration and Architecture 2

## Features

- User login and guest registration
- Room and guest management
- Room reservations
- Payment management
- Digital check-in and check-out
- Digital room keys
- Housekeeping management
- Guest service requests
- Role-based access control

## Technologies Used

- NestJS
- TypeScript
- TypeORM
- MySQL
- JWT and bcrypt
- React and Vite
- Postman
- Git and GitHub

## Installation

Requirements: Node.js 20 or newer (use Node.js 24 for the frontend), MySQL or XAMPP, Git, and Postman.

Clone the repository:

```bash
git clone https://github.com/reyesgeero001/Maristay.git
cd Maristay
npm install
```

Create the environment configuration in PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the database connection, JWT secret, and demo account password in the `.env` file. Do not commit this file.

For a fresh database, run:

```bash
npm run db:setup
```

Alternatively, import `exports/maristay.sql` using phpMyAdmin on a server without an existing `maristay_db` database. The exported accounts use the original seed password. Using `db:setup` allows you to configure your own demo password.

## Running the Backend

Start MySQL in XAMPP, then run:

```bash
npm run start:dev
```

API: http://localhost:3000/api/v1

## Running the Frontend (Optional)

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Website: http://localhost:5173

The frontend uses `VITE_API_BASE_URL` to connect to the backend. The default API is `http://localhost:3000/api/v1`.

## Demo Accounts

| Role | Email |
|---|---|
| Manager | manager@maristay.test |
| Front Desk | frontdesk@maristay.test |
| Guest | juan.delacruz@example.com |
| Housekeeping | housekeeping1@maristay.test |

For newly seeded accounts, use the password configured in `SEED_DEMO_PASSWORD`.

## API Testing

Import the Postman collection and environment from the `exports` folder. Set the local `demoPassword` variable before logging in.

For automated tests:

```bash
npm test
npm run test:e2e
```

Run end-to-end tests only against the isolated test database.

For full Postman collection testing, use the isolated API on port 3001:

```bash
npm run postman:setup
npm run postman:start
```

Run `npm run postman:newman` in a separate terminal with Newman installed. Do not run the full collection against the main database.

## Project Structure

```
src/        Backend source code
frontend/   React frontend
docs/       Project documentation
exports/    SQL database and Postman files
scripts/    Utility scripts
test/       End-to-end tests
```

## Documentation

- [Project Documentation](docs/MariStay_Final_Documentation.pdf)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [Postman Collection](exports/MariStay.postman_collection.json)
- [SQL Database Export](exports/maristay.sql)

## Limitations

Payment processing, digital smart locks, and notifications are simulated. The system is developed as a hotel management backend prototype with an optional frontend.