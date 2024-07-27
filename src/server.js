import sequelize from './config/database.js';
import app from './app.js';
import './models/User.js';
import './models/Account.js';
const port = process.env.PORT || 3001;

sequelize.sync({ force: true })  // Gunakan { force: true } untuk menghapus dan membuat ulang tabel.
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch(err => {
    console.error('Unable to create tables:', err);
  });


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
