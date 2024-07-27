import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/User.js'; 
import Account from './models/Account.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: `${process.env.FRONTEND}`,
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND}/auth/google/callback`,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ where: { googleId: profile.id } });
    
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        image: profile.photos[0].value
      });
    } else {
      if (!user.image || user.image !== profile.photos[0].value) {
        user = await User.update(
          { image: profile.photos[0].value },
          { where: { id: user.id }, returning: true }
        );
      }
    }
    
    await Account.upsert({
      userId: user.id,
      type: 'oauth',
      provider: 'google',
      providerAccountId: profile.id,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: profile._json.expires_at,
      token_type: profile._json.token_type,
      scope: profile._json.scope,
      id_token: profile._json.id_token,
      session_state: profile._json.session_state,
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    req.session.userId = req.user.id;
    res.redirect(`${process.env.FRONTEND}`);
  }
);

app.use('/api/auth', authRoutes);

app.get('/check-session', (req, res) => {
  if (req.session.userId) {
    res.status(200).json({ loggedIn: true });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

export default app;