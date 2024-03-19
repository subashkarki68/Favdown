//backend -> routes -> index.js
const router = require('express').Router();
const userRouter = require('../modules/users/users.route');
const CheckToken = require('../middlewares/checkToken');

router.use('/api/v1/users', CheckToken, userRouter);

module.exports = router;
