const express = require('express');
const router = express.Router();
console.log('lessssgooooooo');
const { pool } = require('../../dbConfig');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// start Google OAuth flow
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google will redirect to this URL after approval
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',    // or your front-end error page
    session: true
  }),
  (req, res) => {
    // On success, redirect to your front-end app
    res.json({ user: req.user });
    res.redirect('http://localhost:3000/dashboard');

  }
);



// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, password2 } = req.body;
  const errors = [];
  if (!name || !email || !password || !password2)
    errors.push({ msg: 'Please fill in all fields' });
  if (password !== password2)
    errors.push({ msg: 'Passwords do not match' });
  if (password.length < 6)
    errors.push({ msg: 'Password must be at least 6 characters' });
  if (errors.length)
    return res.status(400).json({ errors });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (userCheck.rows.length)
      return res.status(400).json({ errors: [{ msg: 'Email already registered' }] });

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name, email, hashed]
    );
    return res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
// router.post('/login', (req, res, next) => {
//   passport.authenticate('local', (err, user, info) => {
//     if (err)   return next(err);
//     if (!user) return res.status(401).json({ error: info.message });
//     // req.logIn(user, (err) => {
//     //   if (err) return next(err);
//     //   // only send back safe info
//     //   return res.json({ user: { id: user.id, name: user.name, email: user.email } });
//     // });
//     const token = jwt.sign(
//       { id: user.id, name: user.name, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRES_IN }
//     );
//   })(req, res, next);
// });
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });

    // Create JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Respond with token and user info
    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  })(req, res, next);
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  // if (!req.isAuthenticated()) {
  //   return res.status(401).json({ error: 'Not authenticated' });
  // }
  router.get('/me', authenticateJWT, (req, res) => {
    res.json({ user: req.user });
  });
  const { id, name, email } = req.user;
  res.json({ user: { id, name, email } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;