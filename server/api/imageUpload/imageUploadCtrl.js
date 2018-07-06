import multer from 'multer';
import watermark from 'dynamic-watermark';
import Jimp from 'jimp';
import videoshow from 'videoshow';
import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';

let imageUploaderCtrl = {};

let storage =   multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        let extn = file.originalname.split('.').pop();
        callback(null, file.fieldname + '-' + Date.now() + '.'+ extn) ;
    }
});
let upload = multer({ storage : storage }).array('userPhoto',4);

let videoOptions = {
    fps: 25,
    loop: 5, // seconds
    transition: true,
    transitionDuration: 5, // seconds
    videoBitrate: 1024,
    videoCodec: 'libx264',
    size: '640x?',
    audioBitrate: '128k',
    audioChannels: 2,
    format: 'mp4',
    pixelFormat: 'yuv420p'
};

function makeSlideShow(files) {
    videoshow(files, videoOptions)
        .save('video.mp4')
        .on('start', function (command) {
            console.log('ffmpeg process started:', command)
        })
        .on('error', function (err, stdout, stderr) {
            console.error('Error:', err);
            console.error('ffmpeg stderr:', stderr)
        })
        .on('end', function (output) {
            console.error('Video created in:', output)
        });
}

function getFiles() {
    return new Promise((resolve,reject) => {
        fs.readdir('./uploads', (err, files) => {
            if(err)  return reject(err);
            resolve(files);
        })
    })
}


function addWaterMark(file) {
    return new Promise((resolve, reject) => {
        let sourcePath =  path.resolve(__dirname + '/../../../uploads/'+file);
        let dimensions = sizeOf(sourcePath);
        let optionsTextWatermark = {
            type: "text",
            text: "Watermark text",
            destination: path.resolve(__dirname + '/../../../processedImage/'+file),
            source: sourcePath,
            position: {
                logoX : dimensions.width/2,
                logoY : dimensions.height/2,
                logoHeight: 200,
                logoWidth: 200
            },
            textOption: {
                fontSize: 100,
                color: '#AAF122'
            }
        };
        watermark.embed(optionsTextWatermark,function(status) {
            console.log(status);
            resolve();

        });
    })
}

function cropImage(imagePath,dimensions) {
    return new Promise(function(resolve,reject) {
        Jimp.read(imagePath).then(function (image) {
            image.crop( 500, 500, dimensions.width-parseInt(dimensions.width*0.3), dimensions.height-parseInt(dimensions.height*0.3))
                .write(imagePath,function() {
                    resolve()
                })
        })
            .catch(function(err) {
                reject(err);
            })
    })
}

function zoomInImage (file) {
    let imagePath  = path.resolve(__dirname + '/../../../processedImage/'+file);
    let dimensions = sizeOf(imagePath);
    cropImage(imagePath,dimensions)
        .then(function() {
            return resizeImage(imagePath,dimensions)
        })
        .then(function() {
            console.log('image enlarged');
        })
        .catch(function(err) {
            console.log(err);
        });
}
function resizeImage(imagePath, dimensions) {
    return new Promise(function(resolve,reject) {
        Jimp.read(imagePath)
            .then(function(imageFile) {
                imageFile.resize(dimensions.width,dimensions.height)
                    .write(imagePath,function() {
                        resolve();
                    });
            })
            .catch(function(err) {
                reject(err);
            })
    })
}
imageUploaderCtrl.imageUploadTasks = function(req,res) {
    upload(req,res,async (err,data) => {
        console.log(data);
        if(err) {
            console.log(err);
            return res.end("Error uploading file.");
        }
        try {
            let files = await getFiles();
            files.forEach(async(file,index) => {
                await addWaterMark(file);
                zoomInImage(file);
                if(index === files.length) {
                    makeSlideShow(files);
                }
            });
            res.end("File is uploaded");
        } catch(err) {
            res.status(500).send(err);
        }

    });
};

module.exports = imageUploaderCtrl;