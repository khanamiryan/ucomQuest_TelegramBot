const AWS = require("aws-sdk");

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

module.exports = s3;