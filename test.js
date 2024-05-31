const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { readFileSync } = require("fs");
const dotenv = require("dotenv");
const { URL } = require("url");

dotenv.config();

// const spacesEndpoint = new URL(process.env.DO_SPACES_ENDPOINT);

const s3Client = new S3Client({
    endpoint: "https://fra1.digitaloceanspaces.com",
    region: "fra1",
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
});

const file = readFileSync("uploads/test.txt");

const uploadParams = {
    Bucket: process.env.DO_SPACES_NAME,
    Key: "any_file_or_path_name.jpg",
    Body: file,
    ACL: "public-read",
};

const run = async () => {
    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        console.log("Your file has been uploaded successfully!", data);
    } catch (err) {
        console.log("Error", err);
    }
};

run();