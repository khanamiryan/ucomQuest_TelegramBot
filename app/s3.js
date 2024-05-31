const {
    S3,S3Client
} = require("@aws-sdk/client-s3");

const dotenv = require("dotenv");

dotenv.config();

// const spacesEndpoint = new URL(process.env.DO_SPACES_ENDPOINT);

const s3 = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: "fra1",

    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey:  process.env.DO_SPACES_SECRET,
    },
});

module.exports = s3;