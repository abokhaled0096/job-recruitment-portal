const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new sqlite3.Database('./db/database.sqlite', (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    // Create jobs table
    db.run(`CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      company TEXT,
      location TEXT
    )`);
    // Create applications table
    db.run(`CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      name TEXT,
      email TEXT,
      resume TEXT,
      FOREIGN KEY(job_id) REFERENCES jobs(id)
    )`);
  }
});

// Routes

// Home page: List all jobs
app.get('/', (req, res) => {
  db.all("SELECT * FROM jobs", [], (err, rows) => {
    if (err) {
      console.error(err);
      res.send("Error retrieving jobs");
    } else {
      res.render('index', { jobs: rows });
    }
  });
});

// Employer dashboard: List all job posts for employers
app.get('/employer', (req, res) => {
  db.all("SELECT * FROM jobs", [], (err, rows) => {
    if (err) {
      console.error(err);
      res.send("Error retrieving jobs for employer");
    } else {
      res.render('employer', { jobs: rows });
    }
  });
});

// Page to post a new job (employer)
app.get('/post-job', (req, res) => {
  res.render('post-job');
});

app.post('/post-job', (req, res) => {
  const { title, description, company, location } = req.body;
  db.run(`INSERT INTO jobs (title, description, company, location) VALUES (?, ?, ?, ?)`,
    [title, description, company, location],
    function(err) {
      if (err) {
        console.error(err);
        res.send("Error posting job");
      } else {
        res.redirect('/');
      }
    });
});

// Job detail page: View job and apply
app.get('/job/:id', (req, res) => {
  const jobId = req.params.id;
  db.get("SELECT * FROM jobs WHERE id = ?", [jobId], (err, job) => {
    if (err || !job) {
      res.send("Job not found");
    } else {
      res.render('job', { job });
    }
  });
});

app.post('/job/:id/apply', (req, res) => {
  const jobId = req.params.id;
  const { name, email, resume } = req.body;
  db.run(`INSERT INTO applications (job_id, name, email, resume) VALUES (?, ?, ?, ?)`,
    [jobId, name, email, resume],
    function(err) {
      if (err) {
        console.error(err);
        res.send("Error applying for job");
      } else {
        res.send("Application submitted successfully!");
      }
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
