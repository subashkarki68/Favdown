//backend -> routes -> index.js
const router = require('express').Router();
const userRouter = require('../modules/users/users.route');
const youtubeRouter = require('../modules/youtube/youtube.route');
const CheckToken = require('../middlewares/checkToken');

router.use('/api/v1/users', CheckToken, userRouter);
router.use('/api/v1/youtube', youtubeRouter);

module.exports = router;
