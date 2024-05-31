const AWS = require("aws-sdk");

const {
    S3,
} = require("@aws-sdk/client-s3");

const dotenv = require("dotenv");

dotenv.config();

const spacesEndpoint = new URL(process.env.DO_SPACES_ENDPOINT);

const s3 = new S3({
    endpoint: spacesEndpoint,
    region: "fra1",

    credentials: new AWS.Credentials({
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey:  process.env.DO_SPACES_SECRET,
    }),
});

module.exports = s3;