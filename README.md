# MMM-Consumer-MQTTRelay

This magic mirror module is the MMM-Consumer-MQTTRelay module that is part of the MMM-Consumer and MMM-Provider interrelated modules.

This module can receive feeds of data from various provider modules, such as the MMM-Provider-JSON module, and can display an overview of the MM data traffic and contents (if required). The primary purpose, however, is to relay the data as a MQTT payload so that other systems can utilise the data. The example included below shows how weather data from the metoffice can be extracted using the MMM-Provider-JSON module and then relayed to a specific MQTT topic for other, none Magic Mirror modules to consume. Because there is a common format employed by all of the providers in this ecosystem, then any can be used as a provider to this module..

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

MQTTConsumerid is set in the config and the none MM MQTT consumer will subscribe to this topic - so the MQTT consumer needs to be configured accordingly.

The free windows app, MQTT explorer, is a good tool for monitoring the success of the deployment of this module and data flow within MQTT.

MQTT messages require a MQTT broker, there are many options available and a Google search is probably the best way to find one suitable to an individual's deployment. This module was tested using a MQTT broker running in a docker container on a Synology NAS.. 

### Dependencies

Before installing this module, also install https://github.com/TheBodger/MMM-ChartUtilities as well as https://github.com/TheBodger/MMM-FeedUtilities 

To use this with the flights data, install https://github.com/TheBodger/MMM-Provider-JSON and follow the instructions that come with that module.

Node modules required

<BR>cd to the MagicMirror folder

<BR>npm i --save csvtojson
<BR>npm install moment-timezone --save

## Standalone Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Clone the module:<br />`git clone https://github.com/TheBodger/MMM-Consumer-Flights`

You can update the list of airports from here to make sure you have all the current airports details : https://openflights.org/data.html , save the file airports.dat into the folder modules/MMM-Consumer-Flights/reference and call it airports.csv

### MagicMirror² Configuration

To use this module, add the following configuration blocks to the modules array in the config file. The MMM-Provider-JSON module is normally required as well to provide the data to display

```js


		{
			module: "MMM-Provider-JSON",
			config: {
				consumerids: ["arrivals",],
				id: 'FlightArrivals', 
				package: 'FlightArrivals',
				urlparams: { apikey: 'aviation stack API key', airportcode: 'LHR' },

			}
		},

		{
			module: "MMM-Consumer-Flights",
			position: "top_left",
			
			config: {
				id: 'arrivals',
			}
		},

```

### Configuration_Options


| Option                  | Details
|------------------------ |--------------
| `text`                | *Optional* - Will be displayed on the magic mirror until the first data has been received and prepared for display <br><br> **Possible values:** Any string.<br> **Default value:** '... loading'
| `id`         | *Required* - The unique ID of this consumer module. This ID must match exactly (CaSe) the consumerids in the provider modules. <br><br> **Possible values:** any unique string<br> **Default value:** none
| `rowcount`            |*Optional* - The number of rows of flights to show at a time<br><br> **Possible values:** A numeric value between 1 and 50 <br> **Default value:** 10
| `exclude`            |*Optional* - An array of field names to exclude from the board<br><br> **Possible values:** An array of 1 or more column names (see below for the list)<br> **Default value:** none
| `icon`            |*Optional* - Include an icon of the airline instead of the text. See notes below on how to add icons to the module folders<br><br> **Possible values:** true or false<br> **Default value:** false
| `codes`            |*Optional* - Show only the codes provided from the provider for Airports, flights and carriers. It is assumed that these will be IATA codes. IF other codes are provided then used the reference setting to convert to strings for displaying on the board<br><br> **Possible values:** true or false<br> **Default value:** true
| `header`            |*Optional* - Include the board header (clock, location etc)<br><br> **Possible values:** true or false<br> **Default value:** true
| `refreshrate`            |*Optional* - The time in milliseconds between showing the next set of flights on the board<br><br> **Possible values:** A numeric value greater than 100  <br> **Default value:** 10000 (10 seconds)
| `flightcount`            |*Optional* - The number of flights to show, the default is all flights passed from the provider, but this can be used to reduce the total number<br><br> **Possible values:** A numeric value greater than 1<br> **Default value:** all (null)
| `scroll`            |*Optional* - If true, then the flights are moved up one at atime on the board, otherwise a full baord at a time is displayed<br><br> **Possible values:** true or false<br> **Default value:** false
| `animate`            |*Optional* - Animate the characters on the board as they change.<br><br> **Possible values:** true or false<br> **Default value:** false
| `simple`            |*Optional* - Show a simple formated board with no embellishments<br><br> **Possible values:** true or false<br> **Default value:** true
| `remarks`            |*Optional* - Display full remarks, using varisou elelments to determine message<br><br> **Possible values:** true or false<br> **Default value:** true
| `theme`            |*Optional* - The name of the theme in the themes folder to use, provided so different colour schemes can be used to mimic different airport's boards<br><br> **Possible values:** the name of a theme folder<br> **Default value:** LHR 
| `size`            |*Optional* - The name of the magic mirror text sixe to apply to the board text<br><br> **Possible values:** any magicmirror text size defined in the main.css or custom.css<br> **Default value:** small
| 'codeshare'			|*Optional* - If scroll is enabled then cycle through each codeshared flight  at each refereh of the board<br><br> **Possible values:** true or false<br> **Default value:** false
| 'localtime' true,			|*Optional* - If true, show the time on the board header in local time (utc + timezone offset)<br><br> **Possible values:** true or false<br> **Default value:** true

### Additional_Notes

The config id must match between providers and consumers. Being a case sensitive environment extra care is needed here.<BR>

TODO Fields available to display on the board, any field or fields can be excluded using the exclude config option

At
Airline (Text or icon)
To
Flight
Remarks
Terminal
Gate

If an airlines ICON is missing from the icons folder, then a temporary one is created in the subfolder of tempicons. These are minimal SVG files containing a possibly shortened name of the airline. These are named in the format of IATAcode_ICAOcode.svg. To add a correct icon, download the image in any format into the icons folder and name it the same as the one in tempicons. if the temporary icon is named with a 3 letter IATAcode this is in theory invalid. When all icons have been added, run the buildairlines.js to update the database so the new icons will appear on the boards next time the module refreshes. Wikipedia is a good source of SVG files. Check copyright usage always.

Missing airlines from the database (airlines.json.master) are reported in the node console log. These are usually 3 letter coded airlines, aviationstack sometimes wrongly reports them without the IATA code and ICAO code in its place. IATA code lists can be found through google or the IATA site when you weant to check the code of an airline

```
cd MAgicMirror/modules/MMM-consumer-Flights
node buildairlines.js

```

The script airports.js exposes the list of iata airportcodes in the file references/airports.csv (down loadable from https://openflights.org/data.html ) so that additional information can be added to the board if it cant be supplied in the main feed from the MMM-Provider-xxx module
if an alternative source is required, clone airports.js and adjust accordingly.

the helper script airline.js exposes a "database" of airline properties and icons obtained from wikipedia; missing icons are replaced with the airline name in red displayed on the board; 

<PRE>

top US carriers

1	Southwest	163.606	 1	157.677	 3.8
2	Delta		152.029	 2	145.647	 4.4
3	American	148.181	 3	144.864	 2.3
4	United		113.197	 4	107.243	 5.6
5	JetBlue		 42.236	 5	 40.015	 5.5
6	SkyWest		 38.956	 6	 35.776	 8.9
7	Alaska		 33.503	 7	 26.067	28.5
8	Spirit		 28.683	 8	 23.813	20.5
9	Frontier	 19.433	10	 16.800	15.7
10	Republic 	 18.640	 9	 16.932	10.1
