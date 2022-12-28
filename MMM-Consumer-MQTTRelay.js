/* global Module,  MMM-Consumer-MQTTRelay */

/* Magic Mirror
 * Module: MMM-Consumer-MQTTRelay
 *
 * By Neil Scott
 * MIT Licensed.
 */

var startTime = new Date(); //use for getting elapsed times during debugging

var feedDisplayPayload = { consumerid: '', providerid: '', payload: '' };

Module.register("MMM-Consumer-MQTTRelay", {

	// Default module config.
	
	defaults: {
		text: "... loading",
		id: null,							// the unique id of this consumer.ie MMCD1
		MQTTConsumerid: 'MMMQTTConsumer',	// id of the external consumer who will subscribe to the MQTT topics published here
		rowcount: 10,						//* Optional * - The number of rows of data to show at a time, 0 means show no data at all
		server:'mqttserverid',				//fully configured URL/address/ip/host etc of the MQTT broker server
		},

	start: function () {

		Log.log(this.name + ' is started!');

		var self = this;

		this.sendNotificationToNodeHelper("CONFIG", { moduleinstance: this.identifier, config: this.config });

		//now we wait for the providers to start ... providing

		this.sendNotificationToNodeHelper("STATUS", this.identifier);

		this.payload = []; //keyed by the sender provider name

	},

	showElapsed: function () {
		endTime = new Date();
		var timeDiff = endTime - startTime; //in ms
		// strip the ms
		timeDiff /= 1000;

		// get seconds 
		var seconds = (timeDiff);
		return (" " + seconds + " seconds");
	},

	notificationReceived: function (notification, payload, sender) {

		var self = this;

		if (sender) {
			Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name + " for consumer " + payload.consumerid);
		} else {
			Log.log(this.name + " received a system notification: " + notification);
		}

		if (notification == 'ALL_MODULES_STARTED') {
			//build my initial payload for any providers listening to me

			feedDisplayPayload.consumerid = this.config.id;
			feedDisplayPayload.payload = "";
			self.sendNotification('MMM-Consumer_READY_FOR_ACTION', feedDisplayPayload); 
			self.sendNotification('MMM-FeedDisplay_READY_FOR_ACTION', feedDisplayPayload); 

		}

		if (notification == 'PROVIDER_DATA' || notification == 'FEED_PROVIDER_DATA') {
			//some one said they have data, it might be for me !

			//console.log(payload.consumerid)
			//console.log(this.identifier)


			//determine the format of the data provided depending on the provider type
			var datatype = 2;
			if (notification == 'PROVIDER_DATA') { datatype = 1; }

			if (payload.consumerid == self.config.id) {

				Log.log(self.name,"Got some new data @ " + this.showElapsed());

				//send the data to the MQTT Publisher

				this.sendNotificationToNodeHelper("SEND_THIS", { moduleinstance: self.identifier, payload: payload, datatype: datatype, sender: sender.name}); //indicate the data type

			}
		}

	},

	//each notification will give us a traffic figure for one provider, so if multiple providers need to merge all data into a temp storage of all providers data

	socketNotificationReceived: function (notification, payload) {
		var self = this;

		Log.log(this.showElapsed(), self.identifier, 'message from nodehelper', notification);

		if (notification == "NEW_TRAFFIC_" + this.identifier && this.config.rowcount > 0) {
			if (payload.payload.trafficdata != null) {
				self.storeData(payload.payload.trafficdata);
				self.updateDom();
			}
		}

	},

	storeData: function (newTrafficData)
	{

		var self = this;
		//store the new data in the overall payload repository and keep it clean as necessarily

		self.payload.push(newTrafficData);

		Log.log(self.identifier + " traffic counters:" + self.payload.length);

		while (self.payload.length > self.config.rowcount)
		{
			self.payload.shift();
		}


    },

	// Override dom generator.
	getDom: function () {

		var self = this

		Log.log(self.identifier + " Hello from getdom @" + this.showElapsed());

		var wrapper = document.getElementById("mqttdisplay");

		if (wrapper == null) {
			wrapper = document.createElement("div");
			wrapper.id = "mqttdisplay";
		}
		else {
			wrapper.replaceChildren();
		}

		Log.log(self.identifier + " trafficitem nodes a " + wrapper.childNodes.length)

		wrapper.appendChild(self.buildheader());

		Log.log(self.identifier + " trafficitem nodes b " + wrapper.childNodes.length )

		Log.log(self.identifier + " trafficitems")

		var counter = 0;

		self.payload.forEach(function (trafficItem) {

			Log.log(self.identifier + " trafficitem " + counter);

			wrapper.appendChild(self.builddisplay(trafficItem))

			counter = counter + 1;

		})

		return wrapper;

	},

	buildheader: function () {

		var table = document.createElement('table');
		table.id = "traffictable";
		var header = table.createTHead();

		header.className = 'xsmall'

		var row = header.insertRow(0);

		var cell = document.createElement("TH");
		cell.innerHTML = "MQTT Topic";
		row.appendChild(cell)
		var cell = document.createElement("TH");
		cell.innerHTML = "TimeStamp";
		row.appendChild(cell)
		var cell = document.createElement("TH");
		cell.innerHTML = "";
		row.appendChild(cell)
		var cell = document.createElement("TH");
		cell.innerHTML = "Data Count";
		row.appendChild(cell)

		return table;

    },

	builddisplay: function (trafficdata) {

		//data is ndf format
		//newitem.subject = topic; newitem['subjectname'] = 'subject';
		//newitem.object = 'Item Count'; newitem['objectname'] = 'object';
		//newitem.value = payload.payload[didx].itemarray.length; newitem['valuename'] = 'itemCount';
		//newitem.timestamp = new Date(); newitem["timestampname"] = 'timestamp'; newitem["timestampformatted"] = new Date();

		var table = document.getElementById('traffictable');

		if (trafficdata != null)
		{

			Log.log(self.identifier + " trafficitem count " + trafficdata.length)

			trafficdata.forEach(function (item) {

				var row = table.insertRow(-1);
				var cell = row.insertCell(0);
				cell.innerHTML = item.subject;
				var cell = row.insertCell(1);
				cell.innerHTML = item.timestampformatted;
				var cell = row.insertCell(2);
				cell.innerHTML = item.object;
				var cell = row.insertCell(3);
				cell.innerHTML = item.value;

			})
		}

		Log.log(self.identifier + " trafficitem rows " + table.childNodes.length)

		return table;

	},

	sendNotificationToNodeHelper: function (notification, payload) {
		this.sendSocketNotification(notification, payload);
	},

});


