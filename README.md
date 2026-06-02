# StraitSec

StraitSec is a full-stack IT Services website built with Node.js, Express, Prisma, PostgreSQL (Supabase), and modern frontend technologies.

## Features

* Contact Form
* Quote Request Form
* Admin Dashboard
* Secure Authentication with JWT
* PostgreSQL Database (Supabase)
* Prisma ORM
* Responsive Design
* Multi-language Support
* Dark/Light Mode
* Secure API Endpoints

## Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL (Supabase)

### ORM

* Prisma

### Security

* JWT Authentication
* Password Hashing (bcrypt)
* Helmet
* Rate Limiting

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/straitsec.git
cd straitsec
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=1h

ADMIN_EMAIL=
ADMIN_NAME=
ADMIN_PASSWORD=
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Seed the admin account:

```bash
npm run seed
```

Start the application:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

---

## Admin Access

Login using the credentials configured in `.env`.

---

## Project Structure

```text
public/
src/
prisma/
scripts/
server.js
package.json
```

---

## Deployment

Recommended deployment:

* Render (Web Service)
* Supabase (PostgreSQL)

---

## Security Notes

* Never commit `.env`
* Never expose database credentials
* Use a strong JWT secret
* Rotate admin credentials regularly

---

## Author

Mohammed Achraf Zellal

Infrastructure Digitale & Cybersecurity Student
Tangier, Morocco

```
```
