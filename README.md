# 🎉 EventHub

A simple Event Registration System built with **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**. Users can create events, register for them, and view their registrations through a clean, single-page interface.

---

## 📌 Features

- Create new events
- View all available events
- Register for an event
- Prevent duplicate registrations
- View registrations for a specific user
- Responsive single-page dashboard
- RESTful API with Prisma ORM

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

---

## 📂 Project Structure

```
EventHub/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── public/
│   └── server.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/madhura7268/EventHub.git
```

Move into the project

```bash
cd EventHub
```

Install dependencies

```bash
npm install
```

Generate Prisma Client

```bash
npx prisma generate
```

Run database migrations

```bash
npx prisma migrate dev --name init
```

Start the development server

```bash
npm run dev
```

Server runs at

```
http://localhost:5000
```

---

## 📡 API Endpoints

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | Get all events |
| POST | `/events` | Create a new event |

### Registrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/registrations` | Register for an event |
| GET | `/registrations/:email` | Get registrations by user email |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create a user (if required) |

---

## 💡 Highlights

- Built with TypeScript for type safety
- Uses Prisma ORM for database operations
- Clean REST API design
- Beginner-friendly project structure
- Single-page dashboard interface
- Duplicate registration prevention

---

## 🚀 Future Improvements

- User authentication
- Event editing and deletion
- Search and filtering
- Pagination
- Email notifications
- Admin dashboard

---

## 👩‍💻 Author

**Madhura Bhaskare**

GitHub: https://github.com/madhura7268

---

## 📄 License

This project is developed for learning and internship purposes.
