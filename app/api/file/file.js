const express = require("express");
const File = require("./file.schema");
const fs = require("fs");
const path = require("path");
const router = express.Router()
const FileType = require('file-type');
const http = require('https'); // or 'https' for https:// URLs
router.post('/', async (req, res) => {
  const file = saveFile(req.body)
  res.json(file)
})
router.get('/', async (req, res) => {
  const files = await File.find();
  res.json(files)
})
router.get('/fileData/:fileName', async (req, res) => {
  const {fileType, fileData} = await getFile(req.params.fileName);


  const data = {
    fileType: fileType,
    fileData: fileData
  }
  res.json(data)
})
router.get('/files/:filename', async(req, res) => {
  const { filename } = req.params;
  // const filePath = `uploads/`;
  //
  // const f = await getFile(filename);

  s3.getObject({
    Bucket: 'allinquest',
    Key: filename
  })
      .on('httpHeaders', function (statusCode, headers) {
        res.set('Content-Length', headers['content-length']);
        res.set('Content-Type', headers['content-type']);
        this.response.httpResponse.createUnbufferedStream()
            .pipe(res);
      })
      .send();

  //res.sendFile(filename, { root: filePath });
});
const saveFile = async (data) => {
  const dir = path.join(__dirname, `../../../files/${data.userCode}/`)
  if (!fs.existsSync(path.join(__dirname, `../../../files/`))) {
    fs.mkdirSync(path.join(__dirname, `../../../files/`));
  }
  const fileName = `${dir}/${data.userCode}${data.userCode}${data.userCode}__${data.fileName}`
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  if (data.fileHref) {
    const file = fs.createWriteStream(fileName);
    await http.get(data.fileHref, (response) => {
      response.pipe(file);
    }).on('error', function (err) { // Handle errors
      fs.unlink(fileName); // Delete the file async. (But we don't check the result)
    });
    const newFile = new File(data);
    return await newFile.save()
  }
}
const getFile = (filename) => {
  return new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: 'allinquest',
      Key: filename
    }, function(err, data) {
      if (err) {
        reject(err);
        return;
      }

      const Body = data.Body;
      const type = data.ContentType;

      resolve({fileType: type, fileData: Body});
    });
  });
};

// const getFileType = (filename) => {
//   const filePath = `../../../uploads/${filename}`
//   return FileType.fromFile(path.join(__dirname, filePath))
// }


const file_system = require('fs');
const archiver = require('archiver');
const s3 = require("../../s3");

router.get('/images', async (req, res) => {
  const output = file_system.createWriteStream('images.zip');
  const archive = archiver('zip');

  output.on('close',  () => {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
  });

  archive.on('error', function(err){
    throw err;
  });

  archive.pipe(output);

// append files from a sub-directory, putting its contents at the root of archive
  const dir = path.join(__dirname, `../../../files/`)
  archive.directory(dir, false);
  archive.finalize().then();

  res.json(true)
})


module.exports = {
  router,
  saveFile,
  // /getFileType,
  getFile,
}
