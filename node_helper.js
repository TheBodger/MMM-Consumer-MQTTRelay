/* global Module, MMM-Consumer-MQTTRelay */

/* Magic Mirror
 * Module: node_helper
 *
 * By Neil Scott
 * MIT Licensed.
 */


//git test

var NodeHelper = require("node_helper");

//this.name String The name of the module

//global Var


//pseudo structures for commonality across all modules
//obtained from a helper file of modules

var LOG = require('../MMM-FeedUtilities/LOG');
var RSS = require('../MMM-FeedUtilities/RSS');

// get required structures and utilities

const structures = require("../MMM-ChartUtilities/structures");
const utilities = require("../MMM-ChartUtilities/common");
const mergutils = new utilities.mergeutils();

var commonutils = require('../MMM-FeedUtilities/utilities');

const JSONutils = new utilities.JSONutils();
const configutils = new utilities.configutils();

const mqtt = require("mqtt");

module.exports = NodeHelper.create({

	start: function () {

		this.debug = false;

		console.log(this.name + ' is started!');
		this.consumerstorage = {}; // contains the config and feedstorage

		this.currentmoduleinstance = '';
		this.logger = {};

	},

	onconnect: function () {

		console.log("MQTT Connected");

	},

	onpackage: function (packet) {
		console.log('MQTT packet:' + packet);
	},

	setconfig: function (aconfig) {

		var self = this

		var moduleinstance = aconfig.moduleinstance;
		var config = aconfig.config;

		//store a local copy so we dont have keep moving it about

		self.consumerstorage[moduleinstance] = { config: config, feedstorage: {} };

		const host = config.server;
		const port = '1883';
		const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

		const connectUrl = `mqtt://${host}:${port}`;
		self.mqttclient = mqtt.connect(connectUrl, {
			clientId,
			clean: true,
			connectTimeout: 4000,
			reconnectPeriod: 1000,
		})

		self.mqttclient.on('connect', self.onconnect);
		self.mqttclient.on('packet', self.onpackage);

	},

	processfeeds: function (newtraffic) { // pass data types so we can work out what provider data type we have received

		var self = this;

		var moduleinstance = newtraffic.moduleinstance; //needed so the correct module knows what to do with this data
		var payload = newtraffic.payload;

		//depending on the config options for this moduleinstance

		//determine what the feedstorekey is

		var feedstorekey = payload.providerid;
		var datatype = newtraffic.datatype;

		var feedstorage = { key: '', titles: [], sourcetitles: [], providers: [], trafficdata: [] };
		var consumerStorage = self.consumerstorage[moduleinstance]
		var topic = 'MM/' + payload.providerid + '/' + consumerStorage.config.MQTTConsumerid //MQTT topic
		var newitem = new structures.NDTFItem();

		//we will need to store all the separate sets of data provided here/ TBD

		//Determine if we have an entry for the moduleinstance of the display module in feedstorage

		if (consumerStorage.feedstorage[feedstorekey] == null) {

			feedstorage.key = feedstorekey;
			feedstorage.titles = [payload.title];				// add the first title we get, which will be many if this is a merged set of feeds
			feedstorage.sourcetitles = [payload.sourcetitle];	// add the first sourcetitle we get, which will be many if this is a merged set of feeds
			feedstorage.providers = [payload.providerid];		// add the first provider we get, which will be many if there are multiple providers and merged

			consumerStorage.feedstorage[feedstorekey] = feedstorage;

		}

		// build the MQTT message and send it

		self.publish(topic, JSON.stringify(payload));

		//json provider has the data in an array below the payload called itemarray
		//feed provider is a level higher

		if (datatype == 1) {

			// add the message details to the top of the message stack for displaying

			newitem.value = payload.payload.length; newitem['valuename'] = 'itemCount';

			newitem.subject = topic; newitem['subjectname'] = 'subject';
			newitem.object = 'Item Count'; newitem['objectname'] = 'object';
			newitem.timestamp = new Date(); newitem["timestampname"] = 'timestamp'; newitem["timestampformatted"] = new Date();

			consumerStorage.feedstorage[feedstorekey].trafficdata.push(newitem);

		}

		else if (datatype == 2) { //always single record

			newitem.value = payload.payload.length; newitem['valuename'] = 'itemCount';

			newitem.subject = topic; newitem['subjectname'] = 'subject';
			newitem.object = 'Item Count'; newitem['objectname'] = 'object';
			newitem.timestamp = new Date(); newitem["timestampname"] = 'timestamp'; newitem["timestampformatted"] = new Date();

			consumerStorage.feedstorage[feedstorekey].trafficdata.push(newitem);
			
		}

		//send the data back to the display

		self.sendNotificationToMasterModule("NEW_TRAFFIC_" + moduleinstance, { payload: { trafficdata: consumerStorage.feedstorage[feedstorekey].trafficdata,sender : newtraffic.sender } });

	},

	publish: function (topic,payload) {

		//send the topic

		var self = this;

		console.log('MQTT Topic/payload:' + topic);
		//console.log(payload)

		self.mqttclient.publish(topic, payload, { qos: 0, retain: true }, (error) => {
			if (error) {
				console.log('MQTT Publish error:' + error);
			}
		})

    },

	showstatus: function (moduleinstance) {
		//console.log("MMM Module: " + moduleinstance);
		console.log('============================ start of status ========================================');

		console.log('config for consumer: ' + moduleinstance);

		console.log(this.consumerstorage[moduleinstance].config);

		console.log('============================= end of status =========================================');

	},

	showElapsed: function () {
		endTime = new Date();
		var timeDiff = endTime - startTime; //in ms
		// strip the ms
		timeDiff /= 1000;

		// get seconds 
		var seconds = Math.round(timeDiff);
		return (" " + seconds + " seconds");
	},

	stop: function () {
		console.log("Shutting down node_helper");
	},

	socketNotificationReceived: function (notification, payload) {
		//console.log(this.name + " NODE_HELPER received a socket notification: " + notification + " - Payload: " + payload);

		//we will receive a payload with the moduleinstance of the consumerid in it so we can store data and respond to the correct instance of
		//the caller - i think that this may be possible!!

		if (this.logger[payload.moduleinstance] == null) {

			this.logger[payload.moduleinstance] = LOG.createLogger("logfile_" + payload.moduleinstance + ".log", payload.moduleinstance);

		};

		this.currentmoduleinstance = payload.moduleinstance;

		switch (notification) {
			case "CONFIG": this.setconfig(payload); break;
			case "RESET": this.reset(payload); break;
			case "SEND_THIS": this.processfeeds(payload); break;
			case "STATUS": this.showstatus(payload); break;
		}
	},

	sendNotificationToMasterModule: function(stuff, stuff2){
		this.sendSocketNotification(stuff, stuff2);
	}

});