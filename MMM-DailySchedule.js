/* global Module */

/* Magic Mirror
 * Module: MMM-DailySchedule
 *
 * By Jared Russell
 * MIT Licensed.
 */

Module.register("MMM-DailySchedule", {
	defaults: {
		updateInterval: 60000,
		retryDelay: 5000
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		this.loaded = false;

		// Schedule update timer.
		//this.getData();
		//self.updateDom();
		setInterval(function() {
			self.updateDom();
		}, this.config.updateInterval);
	},



	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	/*
	Pseudocode 

	Shrink factor: a number that determins how much an element should be shrunk
	Rank: hortizontal position of event
	Width Rank: How far left the event is () Always 1 after the previous event if they share a width
	Left offset: The offset an event should be from the left border (Will increase left margin of this row section)
	Info Spacing: Constant: Vertical distance 

	{
		display_height:
		shrink-factor: 1/sf of full size
		rank: how far stacked this item is
		left offset (int): how many offsets this item should be 

	}



	//Build array of all events
	if (longer than Xpx){
		display like normal
	}
	else {
		Title-Location Display only (maintain minimum height)
	}

	if (start time is earlier info spacing of the previous event){
		increment the shrink factor
		make rank +1 of previous event
	}
	else if (start time is earlier than end time of earlier event){
		Offets the current event by BASE-OFFSET-VALUE plus the offset of previous event
	}
	*/

	getDom: function() {
		var self = this;

		//Should move these to a more appropriate location
		var normal_display_length = 10;

		// create element wrapper for show into the module
		var wrapper = document.createElement("table");
		// If this.dataRequest is not empty

		var now = moment(); //todays date

		var eventsToDisplay = []
		var allDayEventsToDisplay = []

		for(evnt in this.dataNotification){

			//Calculate the difference
			var eventStart = moment(this.dataNotification[evnt]["startDate"],"x");
			var eventEnd = moment(this.dataNotification[evnt]["endDate"],"x");

			//Calculate the cutoffs
			//TODO: Change values to globals
			var earlyCutoff = moment().subtract(120, "minutes");
			var lateCutoff = moment().add(360, 'minutes');

			//TODO: Fix edge case where event is 1440 minutes long but not an all day event e.g. Party that starts at 9am and goes to 9am the next day
			if(startDateTime.isBefore(lateCutoff) && endDateTime.isAfter(earlyCutoff)){

				//Check if its an all day event
				var eventLength = moment.duration(endDateTime.diff(startDateTime)).asMinutes();

				//TODO: Find out if any all day events have a length time other than 1440
				if(eventLength == 1440){
					if(eventStart.isSame(now, 'day')){
						allDayEventsToDisplay.append(evnt);
					}
				}
				else{
					eventsToDisplay.append(evnt);
				}
			}

			var eventWrapper = document.createElement("tr");
			eventWrapper.innerHTML = duration;
			//eventWrapper.innerHTML = this.dataNotification[evnt]["startDate"];
			//eventWrapper.innerHTML = moment(this.dataNotification[evnt]["startDate"],"x").toDate();
			//eventWrapper.innerHTML =  this.dataNotification[evnt]["title"];
			wrapper.appendChild(eventWrapper);
		}

		// if(this.loaded){
		// 	wrapper.innerHTML = "Done";
		// } else {
		// 	wrapper.innerHTML = "Loading...";
		// }

		return wrapper;
	},

	getScripts: function() {
		return ["moment.js"];
	},

	// Load translations files
	getTranslations: function() {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	processData: function(data) {
		var self = this;
		this.dataRequest = data;
		if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
		this.loaded = true;

		// the data if load
		// send notification to helper
		this.sendSocketNotification("{{MODULE_NAME}}-NOTIFICATION_TEST", data);
	},

	// socketNotificationReceived from helper
	notificationReceived: function (notification, payload, sender) {
		if(notification === "CALENDAR_EVENTS") {
			// set dataNotification
			this.loaded = true;
			this.dataNotification = payload;
			this.updateDom();
		}
	},
});
