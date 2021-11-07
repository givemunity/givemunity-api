const middy = require('@middy/core')
const { createError } = require('@middy/util')

const httpResponseSerializer = require('@middy/http-response-serializer')
const cors = require('@middy/http-cors')
const httpErrorHandler = require('./middlewares/httpErrorHandler')
const jsonBodyParser = require('./middlewares/jsonBodyParser')
const inputOutputLogger = require('./middlewares/inputOutputLogger')

const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
AWS.config.update({ region: 'ap-east-1' })
const docClient = new AWS.DynamoDB.DocumentClient()
const sqsClient = new AWS.SQS({apiVersion: '2012-11-05'})

const { v4: uuidv4 } = require('uuid')

const tableName = process.env.TABLE_NAME
const sqsQueueUrl = process.env.SQS_QUEUE_URL

const baseHandler = async (event, context) => {
    const record = {
        id: uuidv4(),
        name: event.body.name,
        email: event.body.email,
        amount: event.body.amount
    }

    await docClient.put({ TableName: tableName, Item: record }).promise()
    await sqsClient.sendMessage({ 
        MessageGroupId: "cv",
        MessageDeduplicationId: record.id,
        MessageBody: JSON.stringify(record),
        QueueUrl: sqsQueueUrl
    }).promise();

    let payment_link = null
    switch (record.amount) {
        case 100:
            payment_link = process.env.MONTHLY_DONTATION_LINK_100
            break
        case 300:
            payment_link = process.env.MONTHLY_DONTATION_LINK_300
            break
        case 500:
            payment_link = process.env.MONTHLY_DONTATION_LINK_500
            break
        default:
            payment_link = process.env.MONTHLY_DONTATION_LINK_500
            break
    }

    const response = { result: 'success', message: 'successfully stored the data', payment_link: payment_link }
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
    .use(cors())

module.exports = { handler }