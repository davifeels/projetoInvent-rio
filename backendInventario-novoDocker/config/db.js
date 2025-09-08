const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();  // importante

pool.getConnection()
  .then(connection => {
    console.log('✅ Conexão com o banco de dados MySQL estabelecida com sucesso!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ ERRO CRÍTICO: Falha na conexão com o MySQL.');
    console.error(err);
    process.exit(1);
  });

module.exports = pool;
