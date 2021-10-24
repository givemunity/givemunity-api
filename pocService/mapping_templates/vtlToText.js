module.exports = async (_) => {
    const fsPromises = require('fs').promises;
    const readAsText = async (path) => {
        return await fsPromises.readFile(path, 'utf-8'); // read json file
    }
  
    return {
        generalErrorRes: await readAsText('./mapping_templates/general_error_response.vtl')
    };
};

