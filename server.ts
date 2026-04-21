import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { addDays, differenceInDays, parseISO } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'library-secret-key';
const PORT = 3000;

// Initialize Database
const db = new Database('library.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'student')) NOT NULL,
    fullName TEXT NOT NULL,
    studentId TEXT UNIQUE,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE NOT NULL,
    category TEXT,
    totalCopies INTEGER DEFAULT 1,
    availableCopies INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    issueDate TEXT NOT NULL,
    dueDate TEXT NOT NULL,
    returnDate TEXT,
    fine REAL DEFAULT 0,
    FOREIGN KEY (bookId) REFERENCES books(id),
    FOREIGN KEY (studentId) REFERENCES users(id)
  );
`);

// Insert Sample Data if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const studentPassword = bcrypt.hashSync('student123', 10);

  db.prepare(`INSERT INTO users (username, password, role, fullName) VALUES (?, ?, ?, ?)`).run('admin', adminPassword, 'admin', 'System Administrator');
  db.prepare(`INSERT INTO users (username, password, role, fullName, studentId, email) VALUES (?, ?, ?, ?, ?, ?)`).run('student', studentPassword, 'student', 'John Doe', 'S101', 'john@example.com');

  db.prepare(`INSERT INTO books (title, author, isbn, category, totalCopies, availableCopies) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 5, 5
  );
  db.prepare(`INSERT INTO books (title, author, isbn, category, totalCopies, availableCopies) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'Clean Code', 'Robert C. Martin', '9780132350884', 'Technical', 3, 3
  );
  db.prepare(`INSERT INTO books (title, author, isbn, category, totalCopies, availableCopies) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Classic', 4, 4
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Middleware: Auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const isAdminM = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  };

  // --- Auth Routes ---
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName } });
  });

  // --- Book Routes ---
  app.get('/api/books', authenticateToken, (req, res) => {
    const { search } = req.query;
    let books;
    if (search) {
      books = db.prepare('SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR category LIKE ?').all(`%${search}%`, `%${search}%`, `%${search}%`);
    } else {
      books = db.prepare('SELECT * FROM books').all();
    }
    res.json(books);
  });

  app.post('/api/books', authenticateToken, isAdminM, (req, res) => {
    const { title, author, isbn, category, totalCopies } = req.body;
    try {
      db.prepare(`INSERT INTO books (title, author, isbn, category, totalCopies, availableCopies) VALUES (?, ?, ?, ?, ?, ?)`).run(
        title, author, isbn, category, totalCopies, totalCopies
      );
      res.status(201).json({ message: 'Book added successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/books/:id', authenticateToken, isAdminM, (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, category, totalCopies, availableCopies } = req.body;
    try {
      db.prepare(`UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, totalCopies = ?, availableCopies = ? WHERE id = ?`).run(
        title, author, isbn, category, totalCopies, availableCopies, id
      );
      res.json({ message: 'Book updated successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/books/:id', authenticateToken, isAdminM, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM books WHERE id = ?').run(id);
      res.json({ message: 'Book deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: 'Cannot delete book (possibly issued)' });
    }
  });

  // --- Transaction Routes ---
  app.post('/api/transactions/issue', authenticateToken, isAdminM, (req, res) => {
    const { bookId, studentId, dueDate } = req.body;
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId) as any;

    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({ error: 'Book not available' });
    }

    const issueDate = new Date().toISOString();
    
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO transactions (bookId, studentId, issueDate, dueDate) VALUES (?, ?, ?, ?)').run(bookId, studentId, issueDate, dueDate);
      db.prepare('UPDATE books SET availableCopies = availableCopies - 1 WHERE id = ?').run(bookId);
    });

    try {
      transaction();
      res.status(201).json({ message: 'Book issued successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/transactions/return/:id', authenticateToken, isAdminM, (req, res) => {
    const { id } = req.params;
    const trans = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;

    if (!trans || trans.returnDate) {
      return res.status(400).json({ error: 'Invalid transaction or book already returned' });
    }

    const returnDate = new Date().toISOString();
    const dueDate = trans.dueDate;
    const daysOverdue = differenceInDays(parseISO(returnDate), parseISO(dueDate));
    const fine = daysOverdue > 0 ? daysOverdue * 5 : 0; // 5 units per day

    const transaction = db.transaction(() => {
      db.prepare('UPDATE transactions SET returnDate = ?, fine = ? WHERE id = ?').run(returnDate, fine, id);
      db.prepare('UPDATE books SET availableCopies = availableCopies + 1 WHERE id = ?').run(trans.bookId);
    });

    try {
      transaction();
      res.json({ message: 'Book returned successfully', fine });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/transactions', authenticateToken, (req: any, res: any) => {
    let query = `
      SELECT t.*, b.title as bookTitle, u.fullName as studentName 
      FROM transactions t
      JOIN books b ON t.bookId = b.id
      JOIN users u ON t.studentId = u.id
    `;
    
    if (req.user.role === 'student') {
      query += ` WHERE t.studentId = ?`;
      const trans = db.prepare(query).all(req.user.id);
      res.json(trans);
    } else {
      const trans = db.prepare(query).all();
      res.json(trans);
    }
  });

  // --- Student Records ---
  app.get('/api/students', authenticateToken, isAdminM, (req, res) => {
    const students = db.prepare("SELECT id, username, fullName, studentId, email FROM users WHERE role = 'student'").all();
    res.json(students);
  });

  // --- Dashboard Stats ---
  app.get('/api/stats', authenticateToken, isAdminM, (req, res) => {
    const totalBooks = (db.prepare('SELECT SUM(totalCopies) as count FROM books').get() as any).count || 0;
    const availableBooks = (db.prepare('SELECT SUM(availableCopies) as count FROM books').get() as any).count || 0;
    const issuedBooks = totalBooks - availableBooks;
    const totalStudents = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as any).count;
    
    const now = new Date().toISOString();
    const overdueBooks = (db.prepare('SELECT COUNT(*) as count FROM transactions WHERE returnDate IS NULL AND dueDate < ?').get(now) as any).count;

    res.json({ totalBooks, availableBooks, issuedBooks, totalStudents, overdueBooks });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
