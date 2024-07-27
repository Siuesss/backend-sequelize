import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
  },
  provider: {
    type: DataTypes.STRING,
  },
  providerAccountId: {
    type: DataTypes.STRING,
  },
  refresh_token: {
    type: DataTypes.STRING,
  },
  access_token: {
    type: DataTypes.STRING,
  },
  expires_at: {
    type: DataTypes.INTEGER,
  },
  token_type: {
    type: DataTypes.STRING,
  },
  scope: {
    type: DataTypes.STRING,
  },
  id_token: {
    type: DataTypes.STRING,
  },
  session_state: {
    type: DataTypes.STRING,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['provider', 'providerAccountId']
    }
  ]
});

Account.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Account, { foreignKey: 'userId' });

export default Account;