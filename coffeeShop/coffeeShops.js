        function newMap() {
            //removes all layers from the map
            coffeeMap.eachLayer(function (layer) {
                coffeeMap.removeLayer(layer);
            });
            //re-adds the tile layer
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2ltbW9uc2QiLCJhIjoiY2poeXk3YzlpMHJsbTNwcnYyNW1zeG9vMCJ9.sRhhJsrU0qUGbM7LiSrW_Q', {
                attribution: 'Map data &copy; <a href = "http://dining.umd.edu/locations/">UMD Dining</a>, <a href="https://www.openstreetmap.org/"> OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox.streets',
            }).addTo(coffeeMap);

			//gets time from the html control
            var time = (document.getElementById("userTime").value);
            //gets rid of the semi-colon and converts the variable to a number that matches
            //closing and opening times in the geojson
            time = time.slice(0, 2) + time.slice(3, 5);
            time = Number(time);
            
            var day = document.getElementById("userDay").value;
            
            //these variables match the field names the function will search for in the geoJSON
            var openTime = day + "_open";
            var closeTime = day + "_close";
            
            //adds a geoJSON layer to the map 
            currentLayer = L.geoJSON(coffeeShops, {
                //configures popups
				onEachFeature: onEachShop, 
                //adds custom icon to represent each point
				pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, {icon: geojsonMarkerOptions});
                },
                //filter that only adds features that are open given the day and time
                filter: function(feature, layer) {
                    //south commons shop and north convenience are the only shops
                    //that close in the AM and need a different expression
                    if(feature.properties.Name === 'South Commons Shop' || feature.properties.Name === 'North Convenience') {
                        if (time <= 100 || time >= feature.properties[openTime]) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        if(time >= feature.properties[openTime] && time < feature.properties[closeTime]) {
                            return true; 
                        } else {
                            return false;
                        }
                    }
                }
            });
            //adds open coffee shops to the map
            currentLayer.addTo(coffeeMap);
        }
        //initializes the map object
		var coffeeMap = L.map('coffeeMap').setView([38.9869, -76.9426], 15);
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2ltbW9uc2QiLCJhIjoiY2poeXk3YzlpMHJsbTNwcnYyNW1zeG9vMCJ9.sRhhJsrU0qUGbM7LiSrW_Q', {
                attribution: 'Map data &copy; <a href = "http://dining.umd.edu/locations/">Univ. of Maryland Dining</a>, <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox.streets',
            }).addTo(coffeeMap);
        
		//adds a scale
		L.control.scale().addTo(coffeeMap);
        
		//stores style for point symbology
        var geojsonMarkerOptions = new L.icon({
            iconUrl: 'coffeeLogo.png',
			iconSize: [50, 50], // size of the icon
			iconAnchor: [25, 50], // point of the icon which will correspond to marker's location
			popupAnchor: [0, -50] // point from which the popup should open relative to the iconAnchor
        });
        
		//contains each field name that will be displayed in the popup and its assc. alias
        var shopFields = {
            'Mon_open': 'Monday Open',
            'Mon_close': 'Monday Close',
            'Tue_open': 'Tuesday Open',
            'Tue_close': 'Tuesday Close',
            'Wed_open': 'Wednesday Open',
            'Wed_close': 'Wednesday Close',
            'Thu_open': 'Thursday Open',
            'Thu_close': 'Thursday Close',
            'Fri_open': 'Friday Open',
            'Fri_close': 'Friday Close',
            'Sat_open': 'Saturday Open',
            'Sat_close': 'Saturday Close',
            'Sun_open': 'Sunday Open',
            'Sun_close': 'Sunday Close'
        };
        
		//function that determines and formats popup content for each coffee shop
        function onEachShop(feature, layer) {
            var popupContent = "<b>" + feature.properties.Name + "</b><br>";
            for(var field in shopFields) {
                if(feature.properties[field]) {
                    var time = feature.properties[field];
					var fieldName = shopFields[field];
                    if (time >= 1200 && time < 2400) {
						//pm times
						if (time >= 1300) {
							time = time - 1200;
						}
						time = time + " p.m.";
					} else { 
						//am times
						if (time === 2400) {
							time -= 1200;
						}
						time = time + " a.m.";
					}
					//adds colon to time string
					if (time.length === 9) {
						time = time.slice(0, 2) + ":" + time.slice(2, 10);
					} else {
						time = time.slice(0, 1) + ":" + time.slice(1, 9);
					}
					popupContent += "<span>" + fieldName + ": " + time + "</span><br>";
                }
            }
			layer.bindPopup(popupContent);
        }
		
		var style = {
			"fillColor": "#00FFFFFF",
			"color": "#5998ff",
			"weight": 3,
			"opacity": 1
		}
