const AWS = require("aws-sdk");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);


const s3 = new AWS.S3({
    endpoint: spacesEndpoint.href,
    region: "nyc3",
    credentials: new AWS.Credentials({
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey:  process.env.DO_SPACES_SECRET,
    }),

});


const file = fs.readFileSync("uploads/test.txt");

s3.putObject({Bucket: process.env.DO_SPACES_NAME, Key: "any_file_or_path_n2ame.jpg", Body: file, ACL:"public-read"}, (err, data) => {
    if (err) return console.log(err);
    console.log("Your file has been uploaded successfully!", data);
});

