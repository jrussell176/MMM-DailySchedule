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

	
	//Influenced by Remi's response to SO question #3895478
	getTimeRange: function(start, numberOfHours, isMilitaryTime){
	  var a=[start], b=start, counter=0;
	  
	  while(counter < numberOfHours){
	  	counter+=1;

	  	if(isMilitaryTime){
	  		if (b < 23){
		  		b+=1;
		  	} else {
		  		b = 0;
		  	}
	  	} else {
	  		if (b < 12){
		  		b+=1;
		  	} else {
		  		b = 1;
		  	}
	  	}
	  	

	  	a.push(b);
	  }
	  return a;

	},
	

	getEvents: function() {

		var self = this;

		//Should move these to a more appropriate location
		var normal_display_length = 10;

		var now = moment(); //todays date

		var eventsToDisplay = [];
		var allDayEventsToDisplay = [];

		//Calculate the cutoffs
		//TODO: Change values to globals
		var earlyCutoff = moment().subtract(120, "minutes");
		var lateCutoff = moment().add(360, 'minutes');

		//var eventStart = moment(this.dataNotification[evnt]["startDate"],"x");
		//var eventEnd = moment(this.dataNotification[evnt]["endDate"],"x");
		

		for(evnt in this.dataNotification){
			//Calculate the difference
			
			var eventStart = moment(this.dataNotification[evnt]["startDate"],"x");
			var eventEnd = moment(this.dataNotification[evnt]["endDate"],"x");

			//TODO: Fix edge case where event is 1440 minutes long but not an all day event e.g. Party that starts at 9am and goes to 9am the next day
			if(eventStart.isBefore(lateCutoff) && eventEnd.isAfter(earlyCutoff)){

				//Check if its an all day event
				var eventLength = moment.duration(eventStart.diff(eventEnd)).asMinutes();

				//TODO: Find out if any all day events have a length time other than 1440
				if(eventLength == 1440){
					if(eventStart.isSame(now, 'day')){
						//allDayEventsToDisplay.push(evnt);
						allDayEventsToDisplay.push(this.dataNotification[evnt]);
					}
				} else {
					//eventsToDisplay.push(evnt);
					eventsToDisplay.push(this.dataNotification[evnt]);
				}
			}
		}

		
		return {
        	eventsToDisplay: eventsToDisplay,
        	allDayEventsToDisplay: allDayEventsToDisplay
    	};

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
	
	//Size constants
	/*
	1 hr = 30px
	width = 240px //Divisible evenly by 1-6, after 7 just stack them all together and let the last item trail
	top = 345px
	
	*/

	//TODO: Add option for 24 hour time
	getDom: function() {
		
		var self = this;

		//Grab the events to be displayed
		var eventData = this.getEvents();

		//Should move these to a more appropriate location
		var normal_display_length = 10;

		var isMilitaryTime = true

		// create element wrapper for show into the module
		var wrapper = document.createElement("div");
		//wrapper.className("daily-schedule");
		// If this.dataRequest is not empty

		//Build the calendar backsplash
		//<div class="line single-digit-spacing">9</div>
		//<div class="line double-digit-spacing">10</div>

		//moment().format("YYYY-MM-DD HH:mm"); // 24H clock
		//moment().format("YYYY-MM-DD hh:mm"); //12H clock
		var now = moment();


		//Determine the starting hour
			
		var startingHour = now.subtract(2,"hours").hours();
		var endingHour = now.add(10,"hours").hours();
		//Reset now
		now = moment();

		var timeRange = this.getTimeRange(startingHour,endingHour,true);
			

		

		timeRange = [1,2,3,4,5,6,7,8,9,10,11,12];

		var backSplash = document.createElement("div");

		//timeRange = [1,2,3,4,5,6,7,8];

		for (hour in timeRange){
			var lineWrapper = document.createElement("div");

			if (timeRange[hour] < 10) {
				lineWrapper.className = "line single-digit-spacing";
			} else {
				lineWrapper.className = "line double-digit-spacing";
			}
			
			lineWrapper.innerHTML = timeRange[hour];
			backSplash.appendChild(lineWrapper);
		}

		wrapper.appendChild(backSplash);

		//Add a calendar item
		/*
		<div class="box">
		  <div class="time">
		    <span>
		      3:30
		    </span>
		    <span>
		      -
		    </span>
		    <span>
		      4:30
		    </span>
		  </div>
		  <div class="title">
		    Flight
		  </div>
		<div>
		*/
		
		var eventBox = document.createElement("div");
		eventBox.className = "event-box";
		
		var eventTime = document.createElement("div");
		eventTime.className = "event-time";
		eventTime.innerHTML = "3:30-4:30";
		
		/*
		var eventStartTime = document.createElement("span");
		eventStartTime.innerHTML = "3:30";
		
		var timeSeperator = document.createElement("span");
		timeSeperator.innerHTML = "-";
		
		var eventEndTime = document.createElement("span");
		eventEndTime.innerHTML = "4:30";
		*/
		
		var eventTitle = document.createElement("div");
		eventTitle.className = "event-title";
		eventTitle.innerHTML = "Flight";

		//eventTime.appendChild(eventStartTime);
		//eventTime.appendChild(timeSeperator);
		//eventTime.appendChild(eventEndTime);

		eventBox.appendChild(eventTime);
		eventBox.appendChild(eventTitle);


		wrapper.appendChild(eventBox);
		
		

		return wrapper;
	},

	
	// Define required scripts.
	getStyles: function () {
		return ["MMM-DailySchedule.css"];
	},
	

	getScripts: function() {
		return ["moment.js","lodash.js"];
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
		this.sendSocketNotification("MMM-DailySchedule-NOTIFICATION_TEST", data);
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
