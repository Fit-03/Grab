// ==========================================================================================================================================
// Copyright (c) 2025 Muhamad Fitri Bin Muhamad Edi (B122410708) & Muhamad Aznizul Humaidi Bin Zulkalnaini (B122410365). All rights reserved.
// This file is part of the Grab Assignment for BERR 2243 - Database And Cloud System.
// ==========================================================================================================================================

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(require('cors')());

let db;

// --- Database Connection --- //
async function connectToMongoDB() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://b122410708:b122410708@assignment.nuhogr8.mongodb.net/';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        db = client.db('Grab');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}
connectToMongoDB();

// --- Middleware: Authentication --- //
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

// --- Middleware: Admin Check --- //
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin only" });
    next();
}

// --- User Endpoints --- //

// Register
app.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) return res.status(400).json({ error: "All fields required" });
        if (!['user', 'driver', 'admin'].includes(role)) return res.status(400).json({ error: "Role must be user, driver, or admin" });
        if (await db.collection('users').findOne({ username })) return res.status(409).json({ error: "Username exists" });
        const hashed = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({ username, password: hashed, role });
        res.status(201).json({ id: result.insertedId, message: "Registered" });
    } catch {
        res.status(500).json({ error: "Failed to register" });
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.collection('users').findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Invalid credentials" });
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Login successful", token });
    } catch {
        res.status(500).json({ error: "Failed to login" });
    }
});

// --- User Ride Endpoints --- //

// Request a ride (user)
app.post('/rides', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'user') return res.status(403).json({ error: "Only users can request rides" });
        const { destination, distance } = req.body;
        if (!destination || !distance) return res.status(400).json({ error: "Destination and distance required" });
        const ride = { userId: req.user.userId, destination, distance, status: 'Pending' };
        const result = await db.collection('rides').insertOne(ride);
        res.status(201).json({ rideID: result.insertedId });
    } catch {
        res.status(500).json({ error: "Failed to create ride" });
    }
});

// Pay for a ride (user)
app.post('/rides/:rideID/pay', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'user') return res.status(403).json({ error: "Only users can pay" });
        const { rideID } = req.params;
        const { paymentMethod, amount } = req.body;
        const result = await db.collection('rides').updateOne(
            { _id: new ObjectId(rideID), userId: req.user.userId, paymentStatus: { $ne: 'Paid' } },
            { $set: { paymentMethod, paymentStatus: 'Paid', amount } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "Ride not found or already paid" });
        res.json({ message: "Payment successful" });
    } catch {
        res.status(500).json({ error: "Failed to pay" });
    }
});

// Ride history (user or driver)
app.get('/rides/history', authenticate, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'user') filter.userId = req.user.userId;
        else if (req.user.role === 'driver') filter.driverId = req.user.userId;
        else return res.status(403).json({ error: "Invalid role" });
        const rides = await db.collection('rides').find(filter).toArray();
        res.json(rides);
    } catch {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// --- Driver Endpoints --- //

// View available rides (driver)
app.get('/rides/available', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'driver') return res.status(403).json({ error: "Only drivers can view available rides" });
        const rides = await db.collection('rides').find({ status: 'Pending' }).toArray();
        res.json(rides);
    } catch {
        res.status(500).json({ error: "Failed to fetch available rides" });
    }
});

// Accept a ride (driver)
app.patch('/rides/:rideID/accept', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'driver') return res.status(403).json({ error: "Only drivers can accept rides" });
        const { rideID } = req.params;
        const result = await db.collection('rides').updateOne(
            { _id: new ObjectId(rideID), status: 'Pending' },
            { $set: { status: 'Accepted', driverId: req.user.userId } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "Ride not found or already accepted" });
        res.json({ message: "Ride accepted" });
    } catch {
        res.status(500).json({ error: "Failed to accept ride" });
    }
});

// Cancel a ride (driver)
app.patch('/rides/:rideID/cancel', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'driver') return res.status(403).json({ error: "Only drivers can cancel rides" });
        const { rideID } = req.params;
        const result = await db.collection('rides').updateOne(
            { _id: new ObjectId(rideID), status: 'Accepted', driverId: req.user.userId },
            { $set: { status: 'Cancelled' } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "Ride not found or not accepted by you" });
        res.json({ message: "Ride cancelled" });
    } catch {
        res.status(500).json({ error: "Failed to cancel ride" });
    }
});

// --- Admin Endpoints --- //

// View all users
app.get('/admin/users', authenticate, isAdmin, async (req, res) => {
    try {
        const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
        res.json(users);
    } catch {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// View all rides
app.get('/admin/rides', authenticate, isAdmin, async (req, res) => {
    try {
        const rides = await db.collection('rides').find().toArray();
        res.json(rides);
    } catch {
        res.status(500).json({ error: "Failed to fetch rides" });
    }
});

// Delete a user
app.delete('/admin/users/:userID', authenticate, isAdmin, async (req, res) => {
    try {
        const { userID } = req.params;
        const result = await db.collection('users').deleteOne({ _id: new ObjectId(userID) });
        if (result.deletedCount === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted" });
    } catch {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

// Update a user (admin)
app.patch('/admin/users/:userID', authenticate, isAdmin, async (req, res) => {
    try {
        const { userID } = req.params;
        const { username, role, password } = req.body;
        if (!username && !role && !password) return res.status(400).json({ error: "Nothing to update" });
        const update = {};
        if (username) update.username = username;
        if (role) {
            if (!['user', 'driver', 'admin'].includes(role)) return res.status(400).json({ error: "Invalid role" });
            update.role = role;
        }
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            update.password = hashed;
        }
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userID) },
            { $set: update }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User updated" });
    } catch {
        res.status(500).json({ error: "Failed to update user" });
    }
});

// --- Analytics Endpoint (admin) --- //
app.get('/admin/analytics', authenticate, isAdmin, async (req, res) => {
    try {
        // User analytics
        const userAnalytics = await db.collection('rides').aggregate([
            {
                $addFields: {
                    userObjId: { $toObjectId: "$userId" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userObjId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $group: {
                    _id: '$user.username',
                    totalRides: { $sum: 1 },
                    totalFare: { $sum: { $toDouble: "$amount" } },
                    avgDistance: { $avg: { $toDouble: "$distance" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    username: '$_id',
                    totalRides: 1,
                    totalFare: { $round: ['$totalFare', 2] },
                    avgDistance: { $round: ['$avgDistance', 2] }
                }
            }
        ]).toArray();

        // Driver analytics
        const driverAnalytics = await db.collection('rides').aggregate([
            {
                $addFields: {
                    driverObjId: { $toObjectId: "$driverId" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'driverObjId',
                    foreignField: '_id',
                    as: 'driver'
                }
            },
            { $unwind: '$driver' },
            {
                $group: {
                    _id: '$driver.username',
                    totalRides: { $sum: 1 },
                    totalFare: { $sum: { $toDouble: "$amount" } },
                    avgDistance: { $avg: { $toDouble: "$distance" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    drivername: '$_id',
                    totalRides: 1,
                    totalFare: { $round: ['$totalFare', 2] },
                    avgDistance: { $round: ['$avgDistance', 2] }
                }
            }
        ]).toArray();

        // Overall totals
        const overall = await db.collection('rides').aggregate([
            {
                $group: {
                    _id: null,
                    totalRides: { $sum: 1 },
                    totalFare: { $sum: { $toDouble: "$amount" } },
                    avgDistance: { $avg: { $toDouble: "$distance" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalRides: 1,
                    totalFare: { $round: ['$totalFare', 2] },
                    avgDistance: { $round: ['$avgDistance', 2] }
                }
            }
        ]).toArray();

        res.json({
            userAnalytics,
            driverAnalytics,
            overall: overall[0] || {}
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

// --- Serve static files (HTML, CSS, JS) --- //
app.use(express.static(path.join(__dirname)));

// --- Start Server --- //
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));