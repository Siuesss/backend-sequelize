import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js'; 
import Account from '../models/Account.js';
import passport from 'passport';
import dotenv from 'dotenv';

dotenv.config();

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

  export default passport;