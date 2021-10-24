const { normalizeHttpResponse } = require('@middy/util')

const defaults = {
    logger: console.error,
    fallbackMessage: null
}

const httpStatusMapping = {
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'Request-URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Requested Range Not Satisfiable',
    417: 'Expectation Failed',
    418: 'I\'m a teapot',
    421: 'Misdirected Request',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    444: 'Connection Closed Without Response',
    451: 'Unavailable For Legal Reasons',
    499: 'Client Closed Request',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required',
    599: 'Network Connect Timeout Error'
}

const httpErrorHandlerMiddleware = (opts = {}) => {
    const options = { ...defaults, ...opts }

    const httpErrorHandlerMiddlewareOnError = async (request) => {
        if (typeof options.logger === 'function') {
            options.logger(request.error)
        }

        // Set default expose value, only passes in when there is an override
        if (request.error?.statusCode && request.error?.expose === undefined) {
            request.error.expose = request.error.statusCode < 500
        }

        // Non-http error OR expose set to false
        if (
            options.fallbackMessage &&
            (!request.error?.statusCode || !request.error?.expose)
        ) {
            request.error = {
                statusCode: 500,
                message: options.fallbackMessage,
                expose: true
            }
        }

        if (request.error?.expose) {
            const body = {
                result: 'error', 
                message: httpStatusMapping[request.error?.statusCode],
                details: request.error?.message
            }
            request.response = normalizeHttpResponse(request.response)
            request.response.statusCode = request.error?.statusCode
            request.response.body = JSON.stringify(body)
            request.response.headers['Content-Type'] = 'application/json'

            return request.response
        }
    }

    return {
        onError: httpErrorHandlerMiddlewareOnError
    }
}
module.exports = httpErrorHandlerMiddleware