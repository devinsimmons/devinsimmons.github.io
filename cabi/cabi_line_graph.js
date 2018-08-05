var days = [];
var members = [];
var casuals = [];


for (var i = 1; i<31; i++) {
    days.push(i);
}

//goes through js object and sorts data into lists that are readable by chart.js
function getNumOfRides(member_type, member_arr) {
    for (var i = 0; i < cabi.length; i++) {
        var obj = cabi[i];
        if (obj.type === member_type) {
            member_arr.push(obj.amount);
        }
    }
}

getNumOfRides("Member", members);
getNumOfRides("Casual", casuals);

//initializes chart
var ctx = document.getElementById("myChart");

//creates double line graph on the chart
var lineGraph = new Chart(ctx, {
    type: 'line',
    data: {
        labels: days,
        datasets: [
            { 
                data: members,
                label: "Member Trips",
                fill: false,
                borderColor: "#377eb8"
            },
            {
                data: casuals,
                label: "Casual Trips",
                fill: false,
                borderColor: "#e41a1c"
            }
        ]
    },
    options: {
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
					labelString: 'Day in June'
				}
			}],
			yAxes: [{
				display: true,
				scaleLabel: {
					display: true,
					labelString: 'Number of Trips'
				}
			}]
		}
    }
    
});