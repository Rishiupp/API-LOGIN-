const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
// const cors = require('cors');
// const pool = require('./dbConfig');
// const pool = require('./dbConfig');
const { pool } = require('./dbConfig');


const initializePassport = require('./passportConfig');
initializePassport(passport);

const authRouter = require('./routes/api/auth');


// await createTables();
const app = express();
const PORT = process.env.PORT || 8080;

//middleware
// parse JSON bodies
app.use(express.json());

// sessions + passport
app.use(session({
  secret: 'secret',      // keep this safe in production!
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//route

//google auth
// In server.js, enable CORS with credentials
const cors = require('cors');
app.use(cors({ 
  origin: 'http://localhost:3000',  //%%%% REACT APP KA URL
  credentials: true
}));




app.use('/api/auth', authRouter);

// health check!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const healthRouter = require('./routes/api/health');
// … after app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);



const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_oauth (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50),
        provider_id VARCHAR(255),
        UNIQUE(user_id, provider)
      );
    `);

    console.log('Tables ensured: users & user_oauth');
  } catch (error) {
    console.error(' Error creating tables:', error);
  }
};

createTables().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });