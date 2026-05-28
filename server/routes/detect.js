const express = require('express');
const detectController = require('../controllers/detectController');

const router = express.Router();

router.post('/', detectController.handleDetect);

module.exports = router;
