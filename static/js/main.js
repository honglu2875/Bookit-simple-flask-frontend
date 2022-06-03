(function($) {

	"use strict";

	// Setup the calendar with the current date
$(document).ready(function(){
    var date = new Date();
    var today = date.getDate();
	// Preprocess data
	var time_slots = [];
	data["data"].forEach(function(slot){
		//var d = Date.parse(slot.first);
		var d_start = new Date(slot.first);
		var d_end = new Date(slot.second);
		//console.log(slot);
		const item = {
	        "start_time": d_start,
			"end_time": d_end,
	        "year": d_start.getFullYear(),
	        "month": d_start.getMonth()+1,
	        "day": d_start.getDate()
    	};
		timeslot_data["slots"].push(item);
	});
    // Set click handlers for DOM elements
    $(".right-button").click({date: date}, next_year);
    $(".left-button").click({date: date}, prev_year);
    $(".month").click({date: date}, month_click);

    // Set current month as active
    $(".months-row").children().eq(date.getMonth()).addClass("active-month");
    init_calendar(date);
    var slots = check_slots(today, date.getMonth()+1, date.getFullYear());
    show_slots(slots, months[date.getMonth()], today);



});

// Initialize the calendar by appending the HTML dates
function init_calendar(date) {
    $(".tbody").empty();
    $(".event-container").empty();
    var calendar_days = $(".tbody");
    var month = date.getMonth();
    var year = date.getFullYear();
    var day_count = days_in_month(month, year);
    var row = $("<tr class='table-row'></tr>");
    var today = date.getDate();
    // Set date to 1 to find the first day of the month
    date.setDate(1);
    var first_day = date.getDay();
    // 35+firstDay is the number of date elements to be added to the dates table
    // 35 is from (7 days in a week) * (up to 5 rows of dates in a month)
    for(var i=0; i<35+first_day; i++) {
        // Since some of the elements will be blank,
        // need to calculate actual date from index
        var day = i-first_day+1;
        // If it is a sunday, make a new row
        if(i%7===0) {
            calendar_days.append(row);
            row = $("<tr class='table-row'></tr>");
        }
        // if current index isn't a day in this month, make it blank
        if(i < first_day || day > day_count) {
            var curr_date = $("<td class='table-date nil'>"+"</td>");
            row.append(curr_date);
        }
        else {
            var curr_date = $("<td class='table-date'>"+day+"</td>");
            var slots = check_slots(day, month+1, year);
            if(today===day && $(".active-date").length===0) {
                curr_date.addClass("active-date");
                show_slots(slots, months[month], day);
            }
            // If this date has any slots, style it with .event-date
            if(slots.length!==0) {
                curr_date.addClass("event-date");
            }
            // Set onClick handler for clicking a date
            curr_date.click({slots: slots, month: months[month], day:day}, date_click);
            row.append(curr_date);
        }
    }
    // Append the last row and set the current year
    calendar_days.append(row);
    $(".year").text(year);
}

// Get the number of days in a given month/year
function days_in_month(month, year) {
    var monthStart = new Date(year, month, 1);
    var monthEnd = new Date(year, month + 1, 1);
    return (monthEnd - monthStart) / (1000 * 60 * 60 * 24);
}

// Event handler for when a date is clicked
function date_click(event) {
    $(".event-container").show(250);
    $("#dialog").hide(250);
    $(".active-date").removeClass("active-date");
    $(this).addClass("active-date");
    show_slots(event.data.slots, event.data.month, event.data.day);
};

// Event handler for when a month is clicked
function month_click(event) {
    $(".event-container").show(250);
    $("#dialog").hide(250);
    var date = event.data.date;
    $(".active-month").removeClass("active-month");
    $(this).addClass("active-month");
    var new_month = $(".month").index(this);
    date.setMonth(new_month);
    init_calendar(date);
}

// Event handler for when the year right-button is clicked
function next_year(event) {
    $("#dialog").hide(250);
    var date = event.data.date;
    var new_year = date.getFullYear()+1;
    $("year").html(new_year);
    date.setFullYear(new_year);
    init_calendar(date);
}

// Event handler for when the year left-button is clicked
function prev_year(event) {
    $("#dialog").hide(250);
    var date = event.data.date;
    var new_year = date.getFullYear()-1;
    $("year").html(new_year);
    date.setFullYear(new_year);
    init_calendar(date);
}

// Event handler for clicking the new event button
function new_booking(event) {
	// if a date isn't selected then do nothing
	    if($(".active-date").length===0)
	        return;
	    // remove red error input on click
	    $("input").click(function(){
	        $(this).removeClass("error-input");
	    })
	    // empty inputs and hide events
	    $("#dialog input[type=text]").val('');
	    $("#dialog input[type=number]").val('');
	    $(".events-container").hide(250);
	    $("#dialog").show(250);
	    // Event handler for cancel button
	    $("#cancel-button").click(function() {
	        $("#name").removeClass("error-input");
	        $("#count").removeClass("error-input");
	        $("#dialog").hide(250);
	        $(".events-container").show(250);
	    });
	    // Event handler for ok button
	    $("#ok-button").unbind().click({slot: event.data.slot}, function() {
	        var slot = event.data.slot;
	        var name = $("#name").val().trim();
			var email = $("#email").val().trim();
	        // Basic form validation
	        if(name.length === 0) {
	            $("#name").addClass("error-input");
	        }
	        else if(email.length == 0) {
	            $("#count").addClass("error-input");
	        }
	        else {
				var data = {
					hostEmail: "honglu2875@gmail.com",
    				startTime: slot.start_time.toISOString(),
    				endTime: slot.end_time.toISOString(),
    				attendees: [{email: email}],
					summary: name
				};
				console.log(data);
	            $.ajax({
					url: "/add_event",
					type: "POST",
					data: JSON.stringify(data),
					contentType: "application/json",
					dataType: "json"
				});
	        }
	    });
}

// Display all slots of the selected date in card views
function show_slots(slots, month, day) {
    // Clear the dates container
    $(".event-container").empty();
    $(".event-container").show(250);

    // If there are no slots for this date, notify the user
    if(slots.length===0) {
        var event_card = $("<div class='event-card'></div>");
        var event_name = $("<div class='event-name'>There is no slot available for "+month+" "+day+".</div>");
        $(event_card).css({ "border-left": "10px solid #FF1744" });
        $(event_card).append(event_name);
        $(".event-container").append(event_card);
    }
    else {
        // Go through and add each event as a card to the slots container
        for(var i=0; i<slots.length; i++) {
            var event_card = $("<div class='event-card' style='background: transparent;'></div>");
			var event_time = $("<div class='event-name'><button>" + formatTime(slots[i]["start_time"]) + " - " + formatTime(slots[i]["end_time"]) + "</button></div>");
			event_card.click({slot: slots[i]}, new_booking)
			$(event_card).append(event_time);
            $(".event-container").append(event_card);
        }
    }
}

function formatTime(date) {
	return date.getHours().toString().padStart(2,"0")+":"+date.getMinutes().toString().padStart(2,"0");
}

// Checks if a specific date has any slots
function check_slots(day, month, year) {
    var slots = [];
    for(var i=0; i<timeslot_data["slots"].length; i++) {
        var slot = timeslot_data["slots"][i];
        if(slot["day"]===day &&
            slot["month"]===month &&
            slot["year"]===year) {
                slots.push(slot);
            }
    }
    return slots;
}


var timeslot_data = {
    "slots": []
};

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

})(jQuery);
