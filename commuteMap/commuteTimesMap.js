	//three functions used to define color for the three different possible layers
	//it was necessary to do three different classifications bc i used a natural breaks classifier for each layer
	function getColorUnd30(d) {
		return d > 76  ? '#006d2c' :
            d > 70  ? '#2ca25f' :
            d > 62   ? '#66c2a4' :
            d > 53   ? '#b2e2e2' :
		    d > 0 ? '#edf8fb' :        
                      '#FFEDA0';
	}
	function getColorUnd60(d) {
		return d > 30 ? '#006d2c' :
           d > 26  ? '#2ca25f' :
           d > 21  ? '#66c2a4' :
           d > 14  ? '#b2e2e2' :
           d > 0   ? '#edf8fb' :
           
                      '#FFEDA0';
	}
	function getColorOvr60(d) {
		return d > 13  ? '#006d2c' :
            d > 10  ? '#2ca25f' :
            d > 7   ? '#66c2a4' :
            d > 5   ? '#b2e2e2' :
		    d > 0 ? '#edf8fb' : 
                      '#FFEDA0';
	}
	
	//leaflet stuff to create map variable
	var commute = L.map('mapid').setView([41.505, -90], 3);

	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2ltbW9uc2QiLCJhIjoiY2poeXk3YzlpMHJsbTNwcnYyNW1zeG9vMCJ9.sRhhJsrU0qUGbM7LiSrW_Q', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            '<a href="https://factfinder.census.gov/faces/tableservices/jsf/pages/productview.xhtml?pid=ACS_16_1YR_S0802&prodType=table">American Community Survey, </a>' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(commute);
	
	
	//defines a styling for the displayed layer. the user's input is determined, 
	//and then the associated property mapped.
	function styleUnd_30(feature) {
		return {
			fillColor: getColorUnd30(feature.properties.Und_30),
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.7,
		};
	}
	function styleUnd_60(feature) {
		return {
			fillColor: getColorUnd60(feature.properties.Und_60),
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.7
		};
	}
	function styleOvr_60(feature){
		return {
			fillColor: getColorOvr60(feature.properties.Ovr_60),
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.7
		};
	}
	
	// control that shows state info on hover
	var info = L.control();

	info.onAdd = function(commute){
		this._div = L.DomUtil.create('div', 'info');
		this.update();
		return this._div;
	};
	
	//defines an event listener if the user mouses over a feature
	function highlightFeature(e) {
		var layer = e.target;
	
		layer.setStyle({
		    weight: 5,
		    color: '#666',
		    dashArray: '',
		    fillOpacity: 0.7
		});
	
		if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
		    layer.bringToFront();
		}
		info.update(layer.feature.properties);
	}
	
	var und_30Layer;
	var und_60Layer;
	var ovr_60Layer;
	
	//event listener for when the mouse moves off a feature
	function resetHighlight(e) {
	    var layers = [und_30Layer, und_60Layer, ovr_60Layer];
		for(var i = 0; i<layers.length; i++) {
			if(commute.hasLayer(layers[i])) {
				layers[i].resetStyle(e.target);
			}
		}
		info.update();
	}
	
	//changes the content of the info box and the legend when the layer is switched. Without this function,
	//the content only changes when features are moused over.

	commute.on('baselayerchange', function(eo) {
		info.update();
		commute.removeControl(legend);
		legend.addTo(commute);
	})
	
	//updates text in info box based on user selection
	info.update = function (commuteTimes) {
		if(commute.hasLayer(und_30Layer)) {
			this._div.innerHTML = '<h6>Percentage of Commutes Under 30 Minutes</h6>' +  (commuteTimes ?
				'<b>' + commuteTimes.NAME + '</b><br />' + commuteTimes.Und_30 + ' %'
				: 'Hover over a state');
		}
		if(commute.hasLayer(und_60Layer)) {
			this._div.innerHTML = '<h6>Percentage of Commutes 30 to 59 Minutes</h6>' +  (commuteTimes ?
				'<b>' + commuteTimes.NAME + '</b><br />' + commuteTimes.Und_60 + ' %'
				: 'Hover over a state');
		}
		if(commute.hasLayer(ovr_60Layer)) {
			this._div.innerHTML = '<h6>Percentage of Commutes 60 Minutes or Longer</h6>' +  (commuteTimes ?
				'<b>' + commuteTimes.NAME + '</b><br />' + commuteTimes.Ovr_60 + ' %'
				: 'Hover over a state');
		}
	};
		
	
	//zooms to feature if the user clicks on it
	function zoomToFeature(e) {
		map.fitBounds(e.target.getBounds());
	}
	//function that attaches listeners to layers so that info can be displayed
	function onEachFeature(feature, layer) {
		layer.on({
		    mouseover: highlightFeature,
		    mouseout: resetHighlight,
		    click: zoomToFeature
		});
	}
	
	
	//the three layers that will be selectable. They call their associated style functions
	var und_30Layer = L.geoJSON(commuteTimes, {
			style: styleUnd_30,
			onEachFeature: onEachFeature
		});
	var und_60Layer = L.geoJSON(commuteTimes, {
			style: styleUnd_60,
			onEachFeature: onEachFeature
		});
	var ovr_60Layer = L.geoJSON(commuteTimes, {
			style: styleOvr_60,
			onEachFeature: onEachFeature
		});
	
	
	//how the selectable layers will be presented in the layers control
	var displayedLayers = {
		"Under 30 Minutes": und_30Layer,
		"30 Minutes to 59 Minutes": und_60Layer,
		"60 Minutes or Longer": ovr_60Layer
	};
	
	//creates the layer control widget
	var layerWidget = L.control.layers(displayedLayers);
	layerWidget.setPosition('bottomleft');
	layerWidget.addTo(commute);
	

	//initializes the legend
	var legend = L.control({position: 'bottomright'});
	//empty array that will contain the grades for the legend after the user selects
	//the map they want to see. it needs to be global so it is defined outside of that
	//function
	var legendGrades = [];
	
	//anytime the legend var is added to the map this function runs so that the right legend
	//is loaded for the right layer.
	legend.onAdd = function (commute) {
		var div = L.DomUtil.create('div', 'info legend'),
			labels = [];
			//adds label to the top of the legend
			div.innerHTML = labels + '<br>';
		for (var i = 0; i < 5; i++) {
			//boolean statements ensure that each radio button has the correct colors dispayed
			//in the legend
			if(commute.hasLayer(und_30Layer)) {
				legendGrades = [0, 53, 62, 70, 76];
				div.innerHTML +=
					'<i style="background:' + getColorUnd30(legendGrades[i] + 1) + '"></i> ' +
					legendGrades[i] + (legendGrades[i + 1] ? ' &ndash; ' + legendGrades[i + 1] + '<br>' : '+');
			}
			if(commute.hasLayer(und_60Layer)) {
				legendGrades = [0, 14, 21, 26, 30];
				div.innerHTML +=
					'<i style="background:' + getColorUnd60(legendGrades[i] + 1) + '"></i> ' +
					legendGrades[i] + (legendGrades[i + 1] ? ' &ndash; ' + legendGrades[i + 1] + '<br>' : '+');
			}
			if(commute.hasLayer(ovr_60Layer)) {
				legendGrades = [0, 5, 7, 10, 13];
				div.innerHTML +=
					'<i style="background:' + getColorOvr60(legendGrades[i] + 1) + '"></i> ' +
					legendGrades[i] + (legendGrades[i + 1] ? ' &ndash; ' + legendGrades[i + 1] + '<br>' : '+');
			}		
		}	
		return div;
	};
	
	//sets the under 30 layer and its info box/legend to load when the page does
	info.addTo(commute);
	und_30Layer.addTo(commute);
	legend.addTo(commute);
	