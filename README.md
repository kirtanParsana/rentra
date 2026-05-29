# Rentra

Modern peer-to-peer rental marketplace platform built with the MERN stack.

Rentra enables users to rent, lend, and manage products seamlessly through a scalable full-stack architecture focused on performance, security, and real-time interactions.

---

# 🚀 Vision

Most products remain unused for 80–90% of their lifetime.

Rentra aims to build a modern rental economy where people can monetize idle products while others access them affordably without ownership costs.

The platform is designed especially for:

* College students
* Urban users
* Freelancers
* Creators
* Temporary-use consumers

---

# ✨ Core Features

## 🔐 Authentication & Security

* JWT-based authentication
* Secure password hashing
* Protected routes
* Role-based access control
* Environment-based configuration

## 📦 Product Listings

* Create rental listings
* Upload product images
* Category-based browsing
* Pricing & availability management
* Search & filtering

## 💬 Real-Time Communication

* Real-time chat system using Socket.io
* Instant messaging
* Online/offline presence
* Read receipts
* Future end-to-end encryption support

## 📅 Booking System

* Rental duration management
* Availability tracking
* Booking requests
* Reservation workflow

## ⭐ Reviews & Ratings

* User reviews
* Product ratings
* Reputation system

## 💳 Payments (Planned)

* Secure payment integration
* Refund workflow
* Escrow-based transaction system

## 📱 Responsive Experience

* Mobile-first UI
* Smooth animations
* Modern UX architecture
* Optimized performance

---

# 🏗️ Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* Framer Motion
* Axios
* React Router

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.io
* JWT Authentication

## DevOps & Tooling

* Git & GitHub
* ESLint
* Prettier
* Concurrently
* Vercel (Frontend Deployment)
* Render/Railway (Backend Deployment)

---

# 📂 Project Structure

```bash
rentra/
│
├── client/                 # Frontend application
│   ├── public/
│   └── src/
│
├── server/                 # Backend application
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── socket/
│   └── server.js
│
├── package.json
├── README.md
└── .gitignore
```

---

# ⚙️ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/kirtanParsana/rentra.git
cd rentra
```

---

## 2. Install Root Dependencies

```bash
npm install
```

---

## 3. Install Frontend Dependencies

```bash
cd client
npm install
```

---

## 4. Install Backend Dependencies

```bash
cd ../server
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173
```

---

# ▶️ Run Development Server

From root folder:

```bash
npm run dev
```

This runs:

* frontend
* backend
  simultaneously.

---

# 🧠 Engineering Goals

Rentra is being developed with focus on:

* scalable architecture
* clean code practices
* modular backend design
* real-time systems
* secure authentication
* production-ready workflows

---

# 📌 Roadmap

## Phase 1 — MVP

* [x] Project setup
* [ ] Authentication system
* [ ] User profiles
* [ ] Product listings
* [ ] Search & filters
* [ ] Booking workflow

## Phase 2 — Real-Time Features

* [ ] Real-time messaging
* [ ] Notifications
* [ ] Presence system

## Phase 3 — Payments & Trust

* [ ] Payment gateway integration
* [ ] Reviews & ratings
* [ ] Rental history
* [ ] Dispute handling

## Phase 4 — Scale

* [ ] Microservice migration
* [ ] CDN optimization
* [ ] AI recommendations
* [ ] Analytics dashboard

---

# 🔒 Security Focus

Security considerations include:

* JWT authentication
* Password hashing
* API validation
* Secure headers
* Rate limiting
* Environment isolation
* Future E2EE messaging support

---

# 📸 Screenshots

> <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/069885f8-e09e-4dd5-931f-9d05fcb9768f" />


---

# 🤝 Contributing

Contributions, ideas, and feedback are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a pull request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

### Kirtan Parsana

Passionate about:

* Full-stack engineering
* AI/ML systems
* Scalable product architecture
* Real-time applications

GitHub:
https://github.com/kirtanParsana

---

# ⭐ Support

If you like this project:

* star the repository
* share feedback
* contribute ideas

Building in public 🚀
