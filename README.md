# Grab Assignment - BERR 2243 Database And Cloud System

## Authors
- Muhamad Fitri Bin Muhamad Edi (B122410708)
- Muhamad Aznizul Humaidi Bin Zulkalnaini (B122410365)

## Overview
This project is a simplified Grab-like ride-hailing web application built for the BERR 2243 - Database And Cloud System course assignment.  
It features user, driver, and admin roles, ride management, payments, analytics, and a responsive dashboard.

## Features
- **User Registration & Login** (JWT authentication)
- **Role-based Dashboard** (User, Driver, Admin)
- **Request, Accept, Cancel, and Pay for Rides**
- **Admin Panel:** Manage users, view all rides, analytics
- **Analytics:** User, driver, and overall ride statistics
- **Responsive UI** (mobile-friendly)
- **MongoDB** as the backend database

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Cloud Atlas)
- **Authentication:** JWT

## Online Demo

You can test the deployed app here:  
👉 [https://grab-assignment-cxefb2gbg9chbpda.eastasia-01.azurewebsites.net/](https://grab-assignment-cxefb2gbg9chbpda.eastasia-01.azurewebsites.net/)

## Folder Structure

```
/Assignment
  |-- index.js         # Backend (Express API)
  |-- main.js          # Frontend logic
  |-- index.html       # Main HTML file
  |-- style.css        # Stylesheet
  |-- README.md        # This file
  |-- .env             # Environment variables (not committed)
```

## API Endpoints (Summary)

- `POST /register` - Register new user/driver/admin
- `POST /login` - Login and get JWT
- `POST /rides` - Request a ride (user)
- `GET /rides/history` - Get ride history (user/driver)
- `GET /rides/available` - Get available rides (driver)
- `PATCH /rides/:rideID/accept` - Accept ride (driver)
- `PATCH /rides/:rideID/cancel` - Cancel ride (driver)
- `POST /rides/:rideID/pay` - Pay for ride (user)
- `GET /admin/users` - List all users (admin)
- `PATCH /admin/users/:userID` - Edit user (admin)
- `DELETE /admin/users/:userID` - Delete user (admin)
- `GET /admin/rides` - List all rides (admin)
- `GET /admin/analytics` - Get analytics (admin)

## Credits

&copy; 2025 Muhamad Fitri Bin Muhamad Edi & Muhamad Aznizul Humaidi Bin Zulkalnaini  
For BERR 2243 - Database And Cloud System Assignment