const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
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

// Initialize SQLite Database
const db = new sqlite3.Database(path.join(__dirname, 'eduwallet.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            examName TEXT NOT NULL,
            subject TEXT NOT NULL,
            year TEXT NOT NULL,
            fileName TEXT NOT NULL,
            filePath TEXT NOT NULL,
            answerKeyFileName TEXT,
            answerKeyPath TEXT,
            date TEXT NOT NULL
        )`);
    }
});

// --- API ROUTES ---

// Get all papers
app.get('/api/papers', (req, res) => {
    db.all('SELECT * FROM papers ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Upload a new paper
app.post('/api/papers', upload.fields([{ name: 'questionPaper', maxCount: 1 }, { name: 'answerKey', maxCount: 1 }]), (req, res) => {
    const { examName, subject, year } = req.body;
    const questionFile = req.files['questionPaper'] ? req.files['questionPaper'][0] : null;
    const answerFile = req.files['answerKey'] ? req.files['answerKey'][0] : null;

    if (!questionFile) {
        return res.status(400).json({ error: 'Question paper file is required' });
    }

    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const sql = `INSERT INTO papers (examName, subject, year, fileName, filePath, answerKeyFileName, answerKeyPath, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        examName,
        subject,
        year,
        questionFile.originalname,
        questionFile.path,
        answerFile ? answerFile.originalname : null,
        answerFile ? answerFile.path : null,
        date
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Paper uploaded successfully' });
    });
});

// Delete a paper
app.delete('/api/papers/:id', (req, res) => {
    const id = req.params.id;
    
    // First, get file paths to delete them from disk
    db.get('SELECT filePath, answerKeyPath FROM papers WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Paper not found' });
            return;
        }

        // Delete files from disk if they exist
        if (row.filePath && fs.existsSync(row.filePath)) fs.unlinkSync(row.filePath);
        if (row.answerKeyPath && fs.existsSync(row.answerKeyPath)) fs.unlinkSync(row.answerKeyPath);

        // Delete from database
        db.run('DELETE FROM papers WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Paper deleted successfully' });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
