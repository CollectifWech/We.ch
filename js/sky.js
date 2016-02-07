var Sky = {
	data: {
		city: geoplugin_city(),
		countryCode: geoplugin_countryCode(),
		key: '1050190b9c72155c5b7efc9b2fec198a',
		cloud: "", 
		timeOfDay: new Date().getHours()*60 + new Date().getMinutes(),
		timeOfSunrise: "", 
		timeOfSunset: "",
		skyColorTable: {},
		cloudColorTable: {},
		textColorTable: {}
	},
	colors: {
		night: ['0a194f', '060834', '060834'],
		day: ['c7ddeb', '81b5dd', '81b5dd'],
		dawn: ['ffb14d', '969698', '375a90'],
		dusk: ['e96d00', '1d426e', '09193a'],
		dayCloud: ['ffffff', 'dadada', 'dadada'],
		nightCloud: [ '232834','07070b', '07070b'],
		dayText: 'ffffff',
		dawnText: 'cc8179',
		duskText: 'bf8c5d',
		nightText: '000220'
	},
	init: function() {
		this.getData(this.data.city, this.data.countryCode, this.data.key, function() {
			this.setSky(this.data.timeOfDay);
			setInterval(function(){ 
			    this.setSky(this.data.timeOfDay);
			}.bind(this), 30000);
		}.bind(this));
	},
	getData: function(city, countryCode, key, callback) {
		$.get('http://api.openweathermap.org/data/2.5/weather?q='+city+','+countryCode+'&appid='+key, function(data) {
			var cloudData = data.clouds.all;
			this.data.cloud = cloudData < 50 ? 0 : ((cloudData-50)*2)/100;
			this.data.timeOfSunrise = this.timeOf(data.sys.sunrise);
			this.data.timeOfSunset = this.timeOf(data.sys.sunset);
			this.data.skyColorTable = this.createSkyColorTable(this.data.timeOfSunrise, this.data.timeOfSunset);
			this.data.cloudColorTable = this.createCloudColorTable(this.data.timeOfSunrise, this.data.timeOfSunset);
			this.data.textColorTable = this.createTextColorTable(this.data.timeOfSunrise, this.data.timeOfSunset);
			
			callback();
		}.bind(this));
	},
	timeOf: function(timestamp) {
		var date = new Date(timestamp*1000);
		var hours = date.getHours();
		var minutes = date.getMinutes();
		return hours*60+minutes;
	},
	createSkyColorTable: function(timeOfSunrise, timeOfSunset) {
		var skyColorTable = new Object();
		skyColorTable[0] = this.colors.night;
		skyColorTable[timeOfSunrise-40] = this.colors.night;
		skyColorTable[timeOfSunrise] = this.colors.dawn;
		skyColorTable[timeOfSunrise+40] = this.colors.day;
		skyColorTable[timeOfSunset-40] = this.colors.day;
		skyColorTable[timeOfSunset] = this.colors.dusk;
		skyColorTable[timeOfSunset+40] = this.colors.night;
		skyColorTable[1440] = this.colors.night;
		return skyColorTable;
	},
	createCloudColorTable: function(timeOfSunrise, timeOfSunset) {
		var cloudColorTable = new Object();
		cloudColorTable[0] = this.colors.nightCloud;
		cloudColorTable[timeOfSunrise-40] = this.colors.nightCloud;
		cloudColorTable[timeOfSunrise+40] = this.colors.dayCloud;
		cloudColorTable[timeOfSunset-40] = this.colors.dayCloud;
		cloudColorTable[timeOfSunset+40] = this.colors.nightCloud;
		cloudColorTable[1440] = this.colors.nightCloud;

		return cloudColorTable;
	},
	createTextColorTable: function(timeOfSunrise, timeOfSunset) {
		var textColorTable = new Object();
		textColorTable[0] = this.colors.nightText;
		textColorTable[timeOfSunrise-40] = this.colors.nightText;
		textColorTable[timeOfSunrise] = this.colors.dawnText;
		textColorTable[timeOfSunrise+40] = this.colors.dayText;
		textColorTable[timeOfSunset-40] = this.colors.dayText;
		textColorTable[timeOfSunset] = this.colors.duskText;
		textColorTable[timeOfSunset+40] = this.colors.nightText;
		textColorTable[1440] = this.colors.nightText;
		return textColorTable;
	},
	setBodyGradient: function(color1, color2, color3) {
		var colors = chroma.scale([color1, color2, color3]).mode("lab").colors(4);
		document.body.style.background = "linear-gradient(to top, " + colors[0] + "," + colors[1] + "," + colors[2] + "," + colors[3];
	},
	getColorRange: function(value, table) {
		var minKey = parseInt(Object.keys(table)[0]);
		var maxKey = parseInt(Object.keys(table)[Object.keys(table).length-1]);
		for (key in table) {
			if (table.hasOwnProperty(key)) {
		        if (value > key && key > minKey) {
		        	minKey = parseInt(key);
		        }
		        if (value < key && key < maxKey) {
		        	maxKey = parseInt(key);
		        }
		        if (value == key) {
		        	minKey = parseInt(key);
		        	maxKey = parseInt(key);
		        }
		    }
		}
		var factor = (value-minKey)/(maxKey-minKey);
		var colorRange = {
			min: table[minKey], 
			max: table[maxKey], 
			factor: factor ? factor : 0.5
		};
		return colorRange;
	},
	computeFinalColor: function(skyColorRange, cloudColorRange, cloud, index, colorSpace) {
		var skyColor = chroma.mix(skyColorRange['min'][index], skyColorRange['max'][index], skyColorRange['factor'], colorSpace);
		var cloudColor = chroma.mix(cloudColorRange['min'][index], cloudColorRange['max'][index], cloudColorRange['factor'], colorSpace);	
		var finalColor = chroma.mix(skyColor, cloudColor, cloud, colorSpace);
		return finalColor;	
	},
	colorsByTime: function(time) {
		var skyColorRange = this.getColorRange(time, this.data.skyColorTable);
		var cloudColorRange = this.getColorRange(time, this.data.cloudColorTable);
		var textColorRange = this.getColorRange(time, this.data.textColorTable);
		var cloud = this.data.cloud;
		var finalColor1 = this.computeFinalColor(skyColorRange, cloudColorRange, cloud, 0, "lab");
		var finalColor2 = this.computeFinalColor(skyColorRange, cloudColorRange, cloud, 1, "lab");
		var finalColor3 = this.computeFinalColor(skyColorRange, cloudColorRange, cloud, 2, "lab");
		var textColor = chroma.mix(textColorRange['min'], textColorRange['max'], textColorRange['factor'], "lab");
		return [finalColor1, finalColor2, finalColor3, textColor];
	},
	setSky: function(time) {
		var colors = this.colorsByTime(time);
		this.setBodyGradient(colors[0], colors[1], colors[2]);
		document.body.style.color = colors[3];
	}
}