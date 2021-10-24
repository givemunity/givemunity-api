const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const mailchimp = require('@mailchimp/mailchimp_marketing')
const crypto = require('crypto')

AWS.config.update({ region: process.env.REGION })

const mailchimpListId = process.env.MAILCHIMP_LIST_ID

mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER,
})

const handler = async (event, context, callback) => {
    for (const record of event.Records) {
        let contactRecord = JSON.parse(record.body);

        const response = await mailchimp.lists.setListMember(
            mailchimpListId,
            crypto.createHash('md5').update(contactRecord.email).digest('hex'),
            {
                email_address: contactRecord.email,
                status_if_new: "subscribed",
                merge_fields: {
                    NAME: contactRecord.name
                }
            }
        )
        console.log(response)
    }
}
  
module.exports = { handler };