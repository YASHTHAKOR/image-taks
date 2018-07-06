import express from 'express';
import bodyParser from 'body-parser';

import config from './config';
import imageUpload from './api/imageUpload';

const app = express();
app.use(bodyParser.json());

app.use('/upload',imageUpload);
app.use('*', express.static(__dirname + '/../client'));
app.listen(config.port,function() {
    console.log('server listening on ' + config.port);
});