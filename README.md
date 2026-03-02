🐦 Twitter Clone API

A secure RESTful backend that powers a micro-blogging platform similar to Twitter, enabling users to register, authenticate, follow others, and interact with tweets.

📌 Overview

This project implements a social media backend with authentication, tweet feeds, followers system, and engagement features using Node.js and SQLite.

🎯 Problem

Modern social platforms require secure authentication, scalable tweet feeds, and relationship-based content delivery.

🚀 Solution

This API enables:

secure user authentication with JWT

personalized tweet feeds

follow & follower relationships

tweet engagement (likes & replies)

secure authorization boundaries

✨ Features

✔ User Registration & Login
✔ JWT Authentication & Authorization
✔ Follow & Followers System
✔ Personalized Tweet Feed
✔ Like & Reply Tracking
✔ Tweet Creation & Deactivation
✔ Secure Access Control

🛠 Tech Stack

Backend: Node.js, Express.js
Database: SQLite
Authentication: JWT
Security: bcrypt password hashing

📁 Project Structure
twitter-clone/
│
├── app.js
├── twitterClone.db
├── package.json
└── README.md

🔐 Authentication

Login returns a JWT token:

Authorization: Bearer <jwt_token>

Include this token in all protected routes.

🔒 Security Features

Password hashing using bcrypt

JWT-based authentication

Authorization checks for tweet access

Protected routes

🚀 Future Improvements

Add tweet media uploads

Real-time notifications

Frontend UI integration

Cloud deployment & scaling

👩‍💻 Author

Keerthana Reddy

Full Stack Developer | ECE Engineer

