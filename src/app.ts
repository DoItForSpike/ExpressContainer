import * as path from "path";
import express = require("express");
import cookieParser = require("cookie-parser");
import logger = require("morgan");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

export const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
