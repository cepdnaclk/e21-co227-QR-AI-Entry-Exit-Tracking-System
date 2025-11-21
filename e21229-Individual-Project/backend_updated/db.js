const { Pool } = require('pg'); //import pg module to interact with PostgreSQL
require('dotenv').config(); //load environment variables from .env file

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

//test connection
pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Connection error", err.stack));

module.exports = pool; //export the pool for use in other files
