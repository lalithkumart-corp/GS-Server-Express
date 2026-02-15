import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// import logger from 'morgan';

import indexRouter from './routes/index.routes.js';
import usersRouter from './routes/user.routes.js';
import authRouter from './routes/auth.routes.js';
import loggerMiddleware from './middlewares/logger.middleware.js';
import { decrypt, encrypt } from './utils/commonUtils.js';
import { consoleLogHandler } from './components/logger/consoleLogHandler.js';

var app = express();

// app.use(logger('dev'));
app.use(cors());
app.use(loggerMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/uploads', express.static(path.join(process.cwd(), 'client/uploads'), {
  setHeaders: (res, filePath) => {
    // Set Content-Type based on file extension
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } // Add more types as needed
  }
}));



// consoleLogHandler();

export default app;
