//gets day value from html select form
var day_in_june = day_selector.value

var hours = [];
var members = [];
var casuals = [];


for (var i = 0; i < 24; i++) {
    hours.push(i);
}

//function takes day that use selected and finds trips taken that day by hour
//runs when button is pressed
function new_chart() {
	//clear lists to add new data, order is chronological
	members = []; 
	casuals = [];
	//day user chose in select box
	var day_picked = day_selector.value;

	//goes through each JSON object
	for (var i = 0; i < trips_hr.length; i++) {
		var obj = trips_hr[i];
		var time = obj.hour_of_trip.split("/");
		var date = time[1];
		//only manipulates object with chosen date
		if(Number(date) === Number(day_picked)) {
			//formats hour of trip
			var hour = time[2].split(" ");
			var hour = hour[1];
			if (obj.member_type === "Member") {
				members.push(obj.number_of_trips);
				
			} else {
				casuals.push(obj.number_of_trips);
			}
		}
	}
	//updates data on the chart dynamically
	barGraph.data.datasets[0].data = members;
	barGraph.data.datasets[1].data = casuals;
	barGraph.options.title.text = "Trips by hour on June " + day_picked + ", 2018";
	window.barGraph.update();	
}

//initializes chart
var ctx = document.getElementById("hours_chart");
//creates double line graph on the chart
var barGraph = new Chart(ctx, {
	type: 'bar',
	data: {
		labels: hours,
		datasets: [
			{ 
				data: members,
				label: "Member Trips",
				fill: false,
				borderColor: "#377eb8",
				backgroundColor: "rgba(55,126,184, 0.7)"
			},
			{
				data: casuals,
				label: "Casual Trips",
				fill: false,
				borderColor: "#e41a1c",
				backgroundColor: "rgba(228,26,28, 0.7)"
			}
		]
	},
	options: {
		title: {
			display: true,
			text: "Trips by hour on June 12, 2018"
		},
		responsive: true,
		hover: {
			mode: 'nearest',
			intersect: true
		},
		tooltips: {
			mode: 'index',
			intersect: false,
		},
		scales: {
			xAxes: [{
				display: true,
				scaleLabel: {
					display: true,
					labelString: 'Hour that trip began'
				}
			}],
			yAxes: [{
				display: true,
				scaleLabel: {
					display: true,
					labelString: 'Number of trips'
				}
			}]
		}
	}
	
});

new_chart();
