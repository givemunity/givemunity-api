module.exports = async (_) => {
    const fsPromises = require('fs').promises;
    const readAsText = async (path) => {
        text = await fsPromises.readFile(path, 'utf-8'); // read json file
        return text.replace(/(\r\n|\n|\r)/gm, ""); // remove line breaks
    }
    return {
        accessLogFormat: await readAsText('./config/apigw_access_logging_format.json'),
        accessDeniedError: await readAsText('./error_templates/access_denied.json'),
        badRequestError: await readAsText('./error_templates/bad_request_body.json'),
        invalidKeyError: await readAsText('./error_templates/invalid_api_key.json'),
        unsupportedFormatError: await readAsText('./error_templates/unsupported_media_type.json')
    };
};