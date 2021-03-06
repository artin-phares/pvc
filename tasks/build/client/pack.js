const config = require('../../../config');
const packer = require('../../packer');

module.exports = {
    deps: ['clean:client'],
    fn: function(gulp) {
        return packer.pack({
            root: config.src.path,
            entry: config.src.client.entry,
            minimize: true,
            supportOldBrowsers: true,
            output: {
                path: config.src.client.output.bundle.path,
                urlPath: config.src.client.output.bundle.urlPath,
                name: config.src.client.output.bundle.name
            }
        });
    }
};