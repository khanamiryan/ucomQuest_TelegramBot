const express = require("express");
const File = require("./file.schema");
const fs = require("fs");
const path = require("path");
const router = express.Router()

router.post('/', async (req, res) => {
  const file = saveFile(req.body)
  res.json(file)
})
router.get('/', async (req, res) => {
  const files = await File.find();
  res.json(files)
})

const saveFile = async (data) => {
  const newFile = new File(data);
  return await newFile.save()
}
const getFile = (filename) => {
  const filePath = `../../../uploads/${filename}`
  const buff = fs.readFileSync(path.join(__dirname, filePath));
  return buff
}

module.exports = {
  router,
  saveFile,
  getFile,
}
