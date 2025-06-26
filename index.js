const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3000;
app.use(express.json());
app.use(require('cors')());

let db;

// Connect to MongoDB
async function connectToMongoDB() {
    const uri = 'mongodb://localhost:27017/';
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

// Middleware: Auth
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

// Register
app.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) return res.status(400).json({ error: "All fields required" });
        if (!['user', 'driver'].includes(role)) return res.status(400).json({ error: "Role must be user or driver" });
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

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));