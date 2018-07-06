import express from 'express';

import uploadCtrl from './imageUploadCtrl';

let router = express.Router();

router.post('/',uploadCtrl.imageUploadTasks);

module.exports = router;