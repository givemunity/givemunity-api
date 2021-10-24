const middy = require('@middy/core')
const { createError } = require('@middy/util')

const httpResponseSerializer = require('@middy/http-response-serializer')
const httpErrorHandler = require('./middlewares/httpErrorHandler')
const jsonBodyParser = require('./middlewares/jsonBodyParser')
const inputOutputLogger = require('./middlewares/inputOutputLogger')

const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
AWS.config.update({ region: 'ap-east-1' })


const baseHandler = async (event, context) => {
    console.log(event.rawBody);

    if (error) {
        throw createError(400, 'error detail');
    }


    const response = { result: 'success', message: 'successfully stored the data' };
    return { statusCode: 201, body: response };
};

const handler = middy(baseHandler)
    .use(jsonBodyParser())
    .use(inputOutputLogger({ encodeRequest: false }))
    .use(httpErrorHandler())
    .use(httpResponseSerializer({
        serializers: [
            {
                regex: /^application\/json$/,
                serializer: ({ body }) => JSON.stringify(body)
            }
        ],
        default: 'application/json'
    }))

module.exports = { handler }