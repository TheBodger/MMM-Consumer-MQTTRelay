# MMM-Consumer-MQTTRelay

This magic mirror module is the MMM-Consumer-MQTTRelay module that is part of the MMM-Consumer and MMM-Provider interrelated modules.

This module can receive feeds of data from various provider modules, such as the MMM-Provider-JSON module, and can display an overview of the MM data traffic and contents (if required). The primary purpose, however, is to relay the data as a MQTT payload so that other systems can utilise the data. The example included below shows how British Rail Departure data from BR can be extracted using the MMM-Provider-JSON module and then relayed to a specific MQTT topic for other, none Magic Mirror modules to consume. In this case the xternal consumer drives a display board showing departure from the chosen station in near real time.

Because there is a common format employed by all* of the providers in this ecosystem, then any* can be used as a provider to this module..

If you require a MM module to send data to MM from MQTT or display MQTT Topics data within the MM environment, there are other MM modules that may be suitable.
### Process

The MM provider crafts a message to send that contains a set of metadata about the data and the data itself.
This MM consumer displays the metadata if required, builds the MQTT topic from the metadata and the config and then publishes the MQTT message to the topic. The MQTT message contains the payload exactly as passed from the provider so that any subscriber can use the same logic as a MMM consumer module to determine if it is for them to process and if it is then to process it.

The provider module message takes the format of:

```
	consumerid - the unique id of the consumer requesting the data (this module)
	providerid - the unique id of the provider who picked up the request and honored it 
	title - depending on the provider module this may contain information
	source - depending on the provider module this may contain information
	payload - the actual data, formatted depending on the provider module
```

The MQTT topic for each message will be MM/providerid/MQTTConsumerid

MQTTConsumerid is set in the config and the external MQTT consumer will subscribe to this topic - so the MQTT consumer needs to be configured accordingly.

### Running MQTT broker

MQTT messages require a MQTT broker, there are many options available and a Google search is probably the best way to find one suitable to an individual's deployment. This module was tested using a MQTT broker running in a docker container on a Synology NAS.. 

### Debugging MQTT

The free windows app, MQTT explorer, is a good tool for monitoring the success of the deployment of this module and data flow within MQTT.

### Dependencies

Before installing this module, also install https://github.com/TheBodger/MMM-ChartUtilities as well as https://github.com/TheBodger/MMM-FeedUtilities 

## Standalone Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Clone the module:<br />`git clone https://github.com/TheBodger/MMM-Consumer-MQTTRelay`

### MagicMirror² Configuration

To use this module, add the following configuration blocks to the modules array in the config file. The MMM-Provider-SOAP module is used in this example to provide the data to send onto the MQTT proxy

```js


		{
			module: "MMM-Provider-SOAP",
			config: {
				consumerids: ["BRDepReading",], //mandatory ID of the consumer receiving the data from the module
				id: 'BRDepReading', //mandatory unique ID
				package: 'BritishRailDeparturesReading', //name of the package that contains a standard set of config details
				filename: 'BritishRailDeparturesReading.json', //the name of an output file containing the details sent to the consumer for debug usage etc
			},
		},

		{
			module: "MMM-Consumer-MQTTRelay",
			position: "top_left",

			config: {
				id: 'BRDepReading',
				MQTTConsumerid: 'MMQTRelay',
				server:'201.10.23.234',
			}
		},

```

### Configuration_Options


| Option                  | Details
|------------------------ |--------------
| `text`                | *Optional* - Will be displayed on the magic mirror until the first data has been received and prepared for display <br><br> **Possible values:** Any string.<br> **Default value:** '... loading'
| `id`         | *Required* - The unique ID of this consumer module. This ID must match exactly (CaSe) the consumerids in the provider modules. <br><br> **Possible values:** any unique string<br> **Default value:** none
| `MQTTConsumerid`         | *Required* - An ID to be used by the external MQTT consumer of the TOPIC to confirm the message is for them. <br><br> **Possible values:** any string<br> **Default value:** none
| `server`         | *Required* - The IP address of the MQTT broker to use. <br><br> **Possible values:** an IP Address<br> **Default value:** none

### Additional_Notes

The config id must match between providers and consumers. Being a case sensitive environment extra care is needed here.<BR>

*Please test any module used as a feed as some are still WIP and may not yet meet standard formats
