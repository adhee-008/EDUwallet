const express = require('express');
const multer = require('multer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend from root
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Initialize SQLite Database with better-sqlite3
const db = new Database(path.join(__dirname, 'eduwallet.db'));

// Create tables if they don't exist
db.exec(`CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    examName TEXT NOT NULL,
    school TEXT NOT NULL,
    grade TEXT NOT NULL,
    subject TEXT NOT NULL,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    answerKeyFileName TEXT,
    answerKeyPath TEXT,
    date TEXT NOT NULL
)`);

console.log('Connected to the SQLite database.');

// --- API ROUTES ---

// Get all papers
app.get('/api/papers', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM papers ORDER BY id DESC').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload a new paper
app.post('/api/papers', upload.fields([{ name: 'questionPaper', maxCount: 1 }, { name: 'answerKey', maxCount: 1 }]), (req, res) => {
    try {
        const { examName, school, grade, subject } = req.body;
        
        if (!school) {
            return res.status(400).json({ error: 'School information is required' });
        }

        const questionFile = req.files['questionPaper'] ? req.files['questionPaper'][0] : null;
        const answerFile = req.files['answerKey'] ? req.files['answerKey'][0] : null;

        if (!questionFile) {
            return res.status(400).json({ error: 'Question paper file is required' });
        }

        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const stmt = db.prepare(`INSERT INTO papers (examName, school, grade, subject, fileName, filePath, answerKeyFileName, answerKeyPath, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        const result = stmt.run(
            examName,
            school,
            grade,
            subject,
            questionFile.originalname,
            questionFile.path,
            answerFile ? answerFile.originalname : null,
            answerFile ? answerFile.path : null,
            date
        );

        res.json({ id: result.lastInsertRowid, message: 'Paper uploaded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a paper
app.delete('/api/papers/:id', (req, res) => {
    try {
        const id = req.params.id;
        
        // First, get file paths to delete them from disk
        const row = db.prepare('SELECT filePath, answerKeyPath FROM papers WHERE id = ?').get(id);
        
        if (!row) {
            return res.status(404).json({ error: 'Paper not found' });
        }

        // Delete files from disk if they exist
        if (row.filePath && fs.existsSync(row.filePath)) fs.unlinkSync(row.filePath);
        if (row.answerKeyPath && fs.existsSync(row.answerKeyPath)) fs.unlinkSync(row.answerKeyPath);

        // Delete from database
        db.prepare('DELETE FROM papers WHERE id = ?').run(id);
        
        res.json({ message: 'Paper deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
