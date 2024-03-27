require('dotenv').config();
const morgan = require('morgan');
const express = require('express');
const indexRouter = require('./routes');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(
    cors({
        origin: 'http://localhost:5173',
    })
);

// Routes
app.use('/', indexRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
