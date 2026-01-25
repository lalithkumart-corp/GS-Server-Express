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
  debug: false,
  timezone: 'Z'
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
  query: (sql, ...args) => {
    return new Promise((resolve, reject) => {

      // If last argument is a function, treat as callback style
      const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      const queryParams = args.length > 0 ? args[0] : undefined;

      if (cb) {
        if (queryParams)
          pool.query(sql, queryParams, cb);
        else
          pool.query(sql, cb);
      } else {
        // return new Promise((resolve, reject) => {
          const callback = (err, results) => {
            if (err) return reject(err);
            return resolve(results);
          };
          if (queryParams)
            pool.query(sql, queryParams, callback);
          else
            pool.query(sql, callback);
        // });
      }
    })
  }
}


export default db;
