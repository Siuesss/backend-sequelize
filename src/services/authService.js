import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const register = async (name, email, password) => {
  console.log('Starting user registration');
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log('Password hashed');
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.error('Email already in use');
      throw new Error('Email already in use');
    }
    const user = await User.create({
      name,
      email,
      hashPassword: hashedPassword,
    });
    console.log('User registered successfully');
    return user;
  } catch (error) {
    console.error('Error in registerUser:', error);
    throw error;
  }
};

const login = async (email, password) => {
  console.log('Starting user login');
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error('User not found');
      throw new Error('Email or password incorrect');
    }
    if (!bcrypt.compareSync(password, user.hashPassword)) {
      console.error('Incorrect password');
      throw new Error('Email or password incorrect');
    }
    console.log('User logged in successfully');
    return user;
  } catch (error) {
    console.error('Error in loginUser:', error);
    throw error;
  }
};

const changepassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentDate = new Date();

    const lastPasswordChange = user.lastPasswordChange || new Date(0);
    const daysSinceLastChange = Math.floor((currentDate.getTime() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastChange > 0) {
      await User.update(
        { passwordChangeCount: 0 },
        { where: { id: userId } }
      );
      user.passwordChangeCount = 0;
    }

    if (user.passwordChangeCount >= 5) {
      throw new Error('Password change limit exceeded for today');
    }

    if (!user.hashPassword) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await User.update(
        {
          hashPassword: hashedPassword,
          passwordChangeCount: user.passwordChangeCount + 1,
          lastPasswordChange: currentDate,
        },
        { where: { id: userId } }
      );
    } else {
      if (!bcrypt.compareSync(oldPassword, user.hashPassword)) {
        throw new Error('Password incorrect');
      } else {
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await User.update(
          {
            hashPassword: hashedPassword,
            passwordChangeCount: user.passwordChangeCount + 1,
            lastPasswordChange: currentDate,
          },
          { where: { id: userId } }
        );
      }
    }

    return { message: 'Password updated successfully' };
  } catch (error) {
    console.error('Error in changepassword:', error);
    throw error;
  }
};

export { register, login, changepassword };