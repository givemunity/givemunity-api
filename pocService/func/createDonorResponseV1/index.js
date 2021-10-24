const middy = require('@middy/core')
const { createError } = require('@middy/util')

const httpResponseSerializer = require('@middy/http-response-serializer')
const httpErrorHandler = require('./middlewares/httpErrorHandler')
const jsonBodyParser = require('./middlewares/jsonBodyParser')
const inputOutputLogger = require('./middlewares/inputOutputLogger')

const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
AWS.config.update({ region: 'ap-east-1' })
const docClient = new AWS.DynamoDB.DocumentClient()

const { v4: uuidv4 } = require('uuid')

const tableName = process.env.TABLE_NAME

const baseHandler = async (event, context) => {
    const record = {
        id: uuidv4(),
        name: event.body.name,
        email: event.body.email,
        amount: event.body.amount
    }

    await docClient.put({ TableName: tableName, Item: record }).promise()

    let link = null
    switch (record.amount) {
        case 100:
            link = process.env.MONTHLY_DONTATION_LINK_100
            break
        case 300:
            link = process.env.MONTHLY_DONTATION_LINK_300
            break
        case 500:
            link = process.env.MONTHLY_DONTATION_LINK_500
            break
        default:
            link = process.env.MONTHLY_DONTATION_LINK_500
            break
    }

    const response = { result: 'success', message: 'successfully stored the data', link: link }
    return { statusCode: 201, body: response }
}

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