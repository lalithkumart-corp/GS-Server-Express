import mysql from 'mysql2';
import { dbconfig } from '../config/index.js';

const pool = mysql.createPool({
  connectionLimit: dbconfig.DB_CONNECTION_POOL,
  queueLimit: dbconfig.DB_QUEUE_LIMIT,
  host: dbconfig.DB_HOST,
  port: dbconfig.DB_PORT,
  user: dbconfig.DB_USER,
  password: dbconfig.DB_PWD,
  database: dbconfig.DB_NAME,
  connectTimeout: dbconfig.DB_CONNECTION_TIMEOUT,
  waitForConnections: true,
  debug: false
});

pool.on('connection', function (connection) {
  console.log('MySQL DB Connection established');
});

pool.on('acquire', function (connection) {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('enqueue', function () {
  console.log('Waiting for available connection slot...');
});

pool.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId);
});

const db = {
  query: (sql, queryParams) => {
    return new Promise((resolve, reject) => {
      const cb = (err, results) => {
        if (err) {
          return reject(err);
        }
        return resolve(results);
      };
      if (queryParams)
        pool.query(sql, queryParams, cb);
      else
        pool.query(sql, cb);
    })
  }
}


export default db;
