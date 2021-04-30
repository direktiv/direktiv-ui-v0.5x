//config-override.js
const webpack = require('webpack')
const path = require('path')
const { babelInclude, override, addExternalBabelPlugins, addWebpackPlugin, addBabelPresets, addWE } = require("customize-cra");
    
// handle importing from bit.dev
module.exports = override(
    babelInclude([
        path.resolve("src"),
        path.resolve("node_modules/@vorteil")
    ]),
    ...addBabelPresets(
        [
            "@babel/preset-react"
        ],
        [
            "@babel/preset-env",
            {
                "modules": "commonjs",
                "loose": true
            }
        ]
    ),
);