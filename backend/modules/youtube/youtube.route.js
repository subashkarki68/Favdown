const express = require('express');
const router = express.Router();
const youtubeController = require('./youtube.controller');

router.get('/download', youtubeController.downloadAudio);

module.exports = router;
