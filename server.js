const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
// const cors = require('cors');


const initializePassport = require('./passportConfig');
initializePassport(passport);

const authRouter = require('./routes/api/auth');



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

// health check
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to your Auth API' });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});