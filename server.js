const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mental_health_db'
});

db.connect((err) => {
    if (err) {
        console.log('Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL!');
    }
});

// ── USERS ──────────────────────────────────────────────

// Get all users
app.get('/api/users', (req, res) => {
    const sql = `
        SELECT u.user_id, u.username, u.email, u.total_points, u.created_at,
            (SELECT mood_score FROM MoodEntry WHERE user_id = u.user_id ORDER BY logged_at DESC LIMIT 1) AS latest_mood,
            (SELECT hours_slept FROM SleepLog WHERE user_id = u.user_id ORDER BY logged_at DESC LIMIT 1) AS latest_sleep,
            (SELECT COUNT(*) FROM UserBadge WHERE user_id = u.user_id) AS badge_count
        FROM User u
        ORDER BY u.total_points DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Register
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO User (username, email, password_hash) VALUES (?, ?, ?)';
    db.query(sql, [username, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        // Award first badge
        db.query('INSERT INTO UserBadge (user_id, badge_id) VALUES (?, 1)', [result.insertId]);
        db.query('UPDATE User SET total_points = total_points + 10 WHERE user_id = ?', [result.insertId]);
        res.json({ message: 'Registered!', userId: result.insertId });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM User WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: 'User not found' });
        const match = await bcrypt.compare(password, results[0].password_hash);
        if (!match) return res.status(401).json({ error: 'Wrong password' });
        res.json({ message: 'Login successful', user: { user_id: results[0].user_id, username: results[0].username, total_points: results[0].total_points } });
    });
});

// ── MOOD ──────────────────────────────────────────────

app.post('/api/mood', (req, res) => {
    const { user_id, mood_score, notes } = req.body;
    const sql = 'INSERT INTO MoodEntry (user_id, mood_score, notes) VALUES (?, ?, ?)';
    db.query(sql, [user_id, mood_score, notes], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('UPDATE User SET total_points = total_points + 5 WHERE user_id = ?', [user_id]);
        res.json({ message: 'Mood logged! +5 points' });
    });
});

app.get('/api/mood/:userId', (req, res) => {
    const sql = 'SELECT * FROM MoodEntry WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30';
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ── SLEEP ──────────────────────────────────────────────

app.post('/api/sleep', (req, res) => {
    const { user_id, hours_slept, quality_score } = req.body;
    const sql = 'INSERT INTO SleepLog (user_id, hours_slept, quality_score) VALUES (?, ?, ?)';
    db.query(sql, [user_id, hours_slept, quality_score], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('UPDATE User SET total_points = total_points + 5 WHERE user_id = ?', [user_id]);
        res.json({ message: 'Sleep logged! +5 points' });
    });
});

app.get('/api/sleep/:userId', (req, res) => {
    const sql = 'SELECT * FROM SleepLog WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30';
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ── ACTIVITY ──────────────────────────────────────────────

app.post('/api/activity', (req, res) => {
    const { user_id, activity_type, duration_minutes } = req.body;
    const sql = 'INSERT INTO Activity (user_id, activity_type, duration_minutes) VALUES (?, ?, ?)';
    db.query(sql, [user_id, activity_type, duration_minutes], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('UPDATE User SET total_points = total_points + 10 WHERE user_id = ?', [user_id]);
        res.json({ message: 'Activity logged! +10 points' });
    });
});

// ── GRATITUDE ──────────────────────────────────────────────

app.post('/api/gratitude', (req, res) => {
    const { user_id, content } = req.body;
    const sql = 'INSERT INTO GratitudeEntry (user_id, content) VALUES (?, ?)';
    db.query(sql, [user_id, content], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('UPDATE User SET total_points = total_points + 5 WHERE user_id = ?', [user_id]);
        res.json({ message: 'Gratitude logged! +5 points' });
    });
});

// ── PEER POSTS ──────────────────────────────────────────────

app.get('/api/posts', (req, res) => {
    const sql = `
        SELECT p.post_id, p.content, p.is_anonymous, p.posted_at,
            CASE WHEN p.is_anonymous = 1 THEN 'Anonymous' ELSE u.username END AS author
        FROM PeerPost p JOIN User u ON p.user_id = u.user_id
        ORDER BY p.posted_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/posts', (req, res) => {
    const { user_id, content, is_anonymous } = req.body;
    const sql = 'INSERT INTO PeerPost (user_id, content, is_anonymous) VALUES (?, ?, ?)';
    db.query(sql, [user_id, content, is_anonymous ? 1 : 0], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('UPDATE User SET total_points = total_points + 15 WHERE user_id = ?', [user_id]);
        res.json({ message: 'Post shared! +15 points' });
    });
});

// ── BADGES ──────────────────────────────────────────────

app.get('/api/badges/:userId', (req, res) => {
    const sql = `
        SELECT b.*, 
            CASE WHEN ub.user_id IS NOT NULL THEN 1 ELSE 0 END AS earned
        FROM Badge b
        LEFT JOIN UserBadge ub ON b.badge_id = ub.badge_id AND ub.user_id = ?
        ORDER BY b.points_required ASC
    `;
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ── ANALYTICS ──────────────────────────────────────────────

// Weekly insights for one user
app.get('/api/analytics/:userId', (req, res) => {
    const userId = req.params.userId;

    const moodSql = `
        SELECT DATE(logged_at) as date, AVG(mood_score) as avg_mood
        FROM MoodEntry WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY
        GROUP BY DATE(logged_at) ORDER BY date ASC
    `;
    const sleepSql = `
        SELECT DATE(logged_at) as date, AVG(hours_slept) as avg_sleep
        FROM SleepLog WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY
        GROUP BY DATE(logged_at) ORDER BY date ASC
    `;
    const statsSql = `
        SELECT 
            (SELECT AVG(mood_score) FROM MoodEntry WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY) AS avg_mood,
            (SELECT AVG(hours_slept) FROM SleepLog WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY) AS avg_sleep,
            (SELECT COUNT(*) FROM Activity WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY) AS activity_count,
            (SELECT COUNT(*) FROM GratitudeEntry WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY) AS gratitude_count
    `;

    db.query(moodSql, [userId], (err, moodData) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query(sleepSql, [userId], (err, sleepData) => {
            if (err) return res.status(500).json({ error: err.message });
            db.query(statsSql, [userId, userId, userId, userId], (err, stats) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ moodData, sleepData, stats: stats[0] });
            });
        });
    });
});

// Overall stats for dashboard
app.get('/api/stats', (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM User) AS total_users,
            (SELECT COUNT(*) FROM MoodEntry WHERE logged_at >= NOW() - INTERVAL 7 DAY) AS moods_this_week,
            (SELECT ROUND(AVG(mood_score),1) FROM MoodEntry WHERE logged_at >= NOW() - INTERVAL 7 DAY) AS avg_mood_this_week,
            (SELECT ROUND(AVG(hours_slept),1) FROM SleepLog WHERE logged_at >= NOW() - INTERVAL 7 DAY) AS avg_sleep_this_week
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
