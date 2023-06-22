module.exports = async function chart (callback) {
	const fs = require("fs");
	const {ChartJSNodeCanvas} = require("chartjs-node-canvas");
	
	const width = 640;
	const height = 360;
	const backgroundColour = "black";
	const chartJSNodeCanvas = new ChartJSNodeCanvas({width, height, backgroundColour});
	
	const configuration = {
		type: "candlestick", 
		data: {
			labels: [2018, 2019, 2020, 2021], 
			datasets: [
				{
					label: "Sample 1", 
					data: [10, 15, -20, 15], 
					fill: false, 
					borderColor: ["rgb(51, 204, 204)"], 
					borderWidth: 1, 
					xAxisID: "xAxis1"
				}, 
				{
					label: "Sample 2", 
					data: [10, 30, 20, 10], 
					fill: false, 
					borderColor: ["rgb(255, 102, 255)"], 
					borderWidth: 1, 
					xAxisID: "xAxis1"
				}, 
			], 
		}, 
		options: {
			scales: {
				y: {
					suggestedMin: 0, 
				}
			}
		}
	}
	
	const currentTime = Math.floor((new Date()).getTime());
	const dataURL = await chartJSNodeCanvas.renderToDataURL(configuration);
	const base64Image = dataURL;
	
	var base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
	
	fs.writeFile("charts/" + currentTime + ".png", base64Data, "base64", function (error) {
		if (error) {
			console.log(error);
		}
	});
	
	callback(currentTime + ".png");
}