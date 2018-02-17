var path = require("path")
var CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
	entry: {
		background: path.resolve("src/background.js"),
		content: path.resolve("src/content.js")
	},
	output: {
		path: path.resolve(__dirname, "./build"),
		filename: "[name].bundle.js",
		sourceMapFilename: "[file].map"
	},
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				include: [
					path.resolve(__dirname, "./src")
				],
				loader: "babel-loader"
			}
		]
	},
	plugins: [
		new CopyWebpackPlugin([
			{
				from: path.resolve(__dirname, "src/manifest.json"),
				to: path.resolve(__dirname, "build/manifest.json")
			}
		])
	]
}
