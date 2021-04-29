//config-override.js
const webpack = require('webpack')
const path = require('path')
const { babelInclude, override, addExternalBabelPlugins, addWebpackPlugin } = require("customize-cra");
    
// handle importing from bit.dev
module.exports = override(
    babelInclude([
        path.resolve("src"),
        path.resolve("node_modules/@vorteil")
    ]),
    ...addExternalBabelPlugins(
        "@babel/plugin-syntax-jsx"
    ),
    addWebpackPlugin(
        new webpack.ProvidePlugin({
            "React": "react",
         }),
    )
);