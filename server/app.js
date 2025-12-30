import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// import logger from 'morgan';

import indexRouter from './routes/index.routes.js';
import usersRouter from './routes/user.routes.js';
import authRouter from './routes/auth.routes.js';
import loggerMiddleware from './middlewares/logger.middleware.js';

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

export default app;
