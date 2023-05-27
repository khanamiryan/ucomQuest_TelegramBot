const multer = require("multer");
const multerS3 = require('multer-s3');
const s3 = require("./s3");

// const upload = multer({ dest: 'public/', storage: storageConfig });
const upload  = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'jamesonquest',
        acl: 'public-read',
        key: function (request, file, cb) {
            cb(null, file.originalname);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
})

module.exports = {
    upload
}