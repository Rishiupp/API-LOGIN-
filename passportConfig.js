const LocalStrategy = require("passport-local").Strategy;
const { pool } = require('./dbConfig');  // Database connection import
const bcrypt = require("bcrypt");  // Password hashing module
const GoogleStrategy = require('passport-google-oauth20').Strategy;

function initialize(passport) {

    // Google OAuth
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
        async (accessToken, refreshToken, profile, done) => {
            const provider = 'google';
            const providerId = profile.id;
            const email = profile.emails[0].value;
            const name = profile.displayName;

            try {
                // 1) Find existing oauth link
                let link = await pool.query(
                    `SELECT user_id FROM user_oauth
            WHERE provider = $1 AND provider_id = $2`,
                    [provider, providerId]
                );

                if (link.rowCount) {
                    // a) If found, load that user
                    const u = await pool.query(
                        `SELECT id, name, email FROM users
            WHERE id = $1`,
                        [link.rows[0].user_id]
                    );
                    return done(null, u.rows[0]);
                }

                // 2) Not linked yet—look up by email
                let userRes = await pool.query(
                    `SELECT id, name, email FROM users WHERE email = $1`,
                    [email]
                );

                let user;
                if (userRes.rowCount) {
                    // b) Existing user: create the link
                    user = userRes.rows[0];
                    await pool.query(
                        `INSERT INTO user_oauth (user_id, provider, provider_id)
            VALUES ($1, $2, $3)`,
                        [user.id, provider, providerId]
                    );
                } else {
                    // c) Brand-new user: insert into users & oauth
                    const newUser = await pool.query(
                        `INSERT INTO users (name, email)
            VALUES ($1, $2)
            RETURNING id, name, email`,
                        [name, email]
                    );
                    user = newUser.rows[0];
                    await pool.query(
                        `INSERT INTO user_oauth (user_id, provider, provider_id)
            VALUES ($1, $2, $3)`,
                        [user.id, provider, providerId]
                    );
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));




    // authenticateUser function - yeh user ka email database mein check karta hai aur password verify karta hai
    const authenticateUser = (email, password, done) => {
        pool.query('SELECT * FROM users WHERE email = $1', [email], (err, results) => {
            if (err) {
                throw err;  // Agar query mein error aayi toh throw kar dega
            }
            console.log(results.rows);  // Database se mila hua user data console mein dekhne ke liye

            if (results.rows.length) {  // Agar user mila database mein
                const user = results.rows[0];

                bcrypt.compare(password, user.password, (err, isMatch) => {  // Password verify kar raha hai
                    if (err) {
                        throw err;
                    }
                    if (isMatch) {
                        return done(null, user);  // Password match hua toh user ko return karo
                    } else {
                        return done(null, false, { message: "Password is not correct" });  // Galat password
                    }
                });
            } else {
                return done(null, false, { message: "Email not registered" });  // Agar email hi nahi mila
            }
        });
    };

    // passport.use - LocalStrategy ke through email aur password ko verify karne ke liye
    passport.use(new LocalStrategy({
        usernameField: "email",
        passwordField: "password"
    }, authenticateUser));

    // serializeUser - user ki id ko session mein save karta hai
    passport.serializeUser((user, done) => done(null, user.id));

    // deserializeUser - id ke basis pe database se user ka pura data laata hai
    passport.deserializeUser((id, done) => {
        pool.query('SELECT * FROM users WHERE id = $1', [id], (err, results) => {
            if (err) {
                throw err;
            }
            return done(null, results.rows[0]);  // Database se mila hua user wapas return karta hai
        });
    });
}

module.exports = initialize;  // initialize function ko export kar diya taaki kahin aur use ho sake
