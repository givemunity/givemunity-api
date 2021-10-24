const { createError } = require('@middy/util')
const mimePattern = /^application\/(.+\+)?json(;.*)?$/

const defaults = {
    reviver: undefined
}

const httpJsonBodyParserMiddleware = (opts = {}) => {
    const options = { ...defaults, ...opts }
    const httpJsonBodyParserMiddlewareBefore = async (request) => {
        const { headers, body } = request.event

        const contentTypeHeader =
            headers?.['Content-Type'] ?? headers?.['content-type']

        if (mimePattern.test(contentTypeHeader)) {
            try {
                const data = request.event.isBase64Encoded
                    ? Buffer.from(body, 'base64').toString()
                    : body
                request.event.rawBody = data
                request.event.body = typeof (data) === "object" 
                    ? data
                    : JSON.parse(data, options.reviver)
                if (typeof request.event.body !== "object") throw createError(422, 'Content type defined as JSON but an invalid JSON was provided')
            } catch (err) {
                // UnprocessableEntity
                throw createError(422, 'Content type defined as JSON but an invalid JSON was provided')
            }
        }
    }

    return {
        before: httpJsonBodyParserMiddlewareBefore
    }
}
module.exports = httpJsonBodyParserMiddleware