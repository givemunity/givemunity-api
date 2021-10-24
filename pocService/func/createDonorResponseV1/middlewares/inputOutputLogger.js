const defaults = {
    logger: (type, data) => console.log(`${type}:`, JSON.stringify(data, null, 2)),
    omitPaths: [],
    encodeRequest: false,
    encodeResponse: false
}

const inputOutputLoggerMiddleware = (opts = {}) => {
    let { logger, omitPaths, encodeRequest, encodeResponse } = { ...defaults, ...opts }
    if (typeof logger !== 'function') logger = null

    const encodeBase64 = (data) => {
        if (typeof data == 'object') data = JSON.stringify(data)
        let buff = Buffer.from(data)
        let encodedData = buff.toString('base64')
        return encodedData
    }

    const inputOutputLoggerMiddlewareBefore = async (request) => {
        let data;
        if (request.event.requestContext) {
            // When invoked by API Gateway
            data = {
                "requestId": request.event.requestContext.requestId,
                "requestIp": request.event.requestContext.identity.sourceIp,
                "requestMethod": request.event.httpMethod,
                "host": request.event.headers.Host,
                "resourcePath": request.event.requestContext.path,
                "stage": process.env["STAGE"]
            }
        } else {
            // When invoked by other Lambdas
            data = {
                "headers": request.event.headers,
                "stage": process.env["STAGE"]
            }
        }
        if (request.event.body) {
            const redactedBody = omit(JSON.parse(JSON.stringify(request.event.body)), omitPaths) // Full clone to prevent nested mutations
            data.requestBody = encodeRequest ? encodeBase64(redactedBody) : redactedBody
        }

        logger('Request Info', data);
    }

    const inputOutputLoggerMiddlewareAfter = async (request) => {
        if (request.response) {
            const redactedBody = omit(JSON.parse(JSON.stringify(request.response)), omitPaths) // Full clone to prevent nested mutations
            const loggedBody = encodeResponse ? encodeBase64(redactedBody) : redactedBody
            logger('res-payload', loggedBody)
        }
    }
    const inputOutputLoggerMiddlewareOnError = inputOutputLoggerMiddlewareAfter
    return {
        before: logger ? inputOutputLoggerMiddlewareBefore : undefined,
        after: logger ? inputOutputLoggerMiddlewareAfter : undefined,
        onError: logger ? inputOutputLoggerMiddlewareOnError : undefined
    }
}


// move to util, if ever used elsewhere
const pick = (originalObject = {}, keysToPick = []) => {
    const newObject = {}
    for (const path of keysToPick) {
        // only supports first level
        if (originalObject[path] !== undefined) {
            newObject[path] = originalObject[path]
        }
    }
    return newObject
}
const omit = (originalObject = {}, keysToOmit = []) => {
    const clonedObject = { ...originalObject }
    for (const path of keysToOmit) {
        deleteKey(clonedObject, path)
    }
    return clonedObject
}

const deleteKey = (obj, key) => {
    if (!Array.isArray(key)) key = key.split('.')
    const rootKey = key.shift()
    if (key.length && obj[rootKey]) {
        deleteKey(obj[rootKey], key)
    } else {
        delete obj[rootKey]
    }
    return obj
}

module.exports = inputOutputLoggerMiddleware