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

## Usage

### User
- Register as a user
- Log in to your account
- Request a ride by entering your destination and distance
- Wait for driver to accept or cancel your ride
- Pay for your accepted rides
- View your ride history

### Driver
- Register as a driver
- Log in to your account
- View available ride requests
- Accept or cancel ride requests
- View your accepted and completed rides

### Admin
- Register or log in with admin credentials
- View and manage all users (edit or delete accounts)
- View all rides in the system
- Access analytics and statistics for users, drivers, and overall rides

### Demo Accounts

Instead of using the demo account, you can create your own account.

| Role   | Username | Password  |
|--------|----------|-----------|
| Admin  | admin    | admin     |
| Driver | driver   | driver    |
| User   | user     | user      |

## User Roles

- **User:** Can request and pay for rides.
- **Driver:** Can accept/cancel rides.
- **Admin:** Can manage users, view all rides, and see analytics.

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

## Credits

&copy; 2025 Muhamad Fitri Bin Muhamad Edi & Muhamad Aznizul Humaidi Bin Zulkalnaini  
For BERR 2243 - Database And Cloud System Assignment