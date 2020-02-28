//set style for points
var image = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 2.65,
        stroke: new ol.style.Stroke({color: 'black', width: .5}),
        fill: new ol.style.Fill({color: '#20baa3'})
    })
});
//styles for lines
var lines = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: "#2e6fd9",
        width: 4
    }),
    zIndex: 0
});
//set style for different geometries
var styles = {
    'Point': image,
    'MultiPoint': image,
    'LineString': lines,
    'MultiLineString': lines
}
//style for lines that are hovered over
var lineHoverStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: '#0f397d',
        width: 4
    }),
    //moves feature above all other features
    zIndex: 1
})
//style for points that are hovered over
var pointHoverStyle = new ol.style.Style({
    image: new ol.style.Circle({
        radius: getRadiusFromZoom(),
        stroke: new ol.style.Stroke({
            color: 'black',
            width: .5
        }),
        fill: new ol.style.Fill({color: '#0A6358'})
    }),
    //moves feature above all other features
    zIndex: 1
})
//function that accesses styles baased on feature geometry
var styleFunction = function(feature) {
    if (feature.hidden) {
        //features that are hidden (do not match query parametes) are made invisible
        return;
    } else {
        return styles[feature.getGeometry().getType()];
    }
}


//creating the terminal layer and setting its source
var terminalSource = new ol.source.Vector({
    features: (new ol.format.GeoJSON()).readFeatures(terminals)
});
var terminalLayer = new ol.layer.Vector({
    source: terminalSource,
    style: styleFunction
});
//creating the segment layer and setting its source
var segmentSource = new ol.source.Vector({
    features: (new ol.format.GeoJSON()).readFeatures(segments)
});
var segmentLayer = new ol.layer.Vector({
    source: segmentSource,
    style: styleFunction
});
//configuring popup box. these elements compose it
var container = document.getElementById('popup');
//adding my own header to the popup, outside of the normal popup content

var popup_header = document.getElementById('popup-header-div');

var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

//overlay that anchors the popup to the map
var overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
});
//event handler that closes the popup upon clicking
closer.onclick = function() {
    overlay.setPosition(undefined);
    closer.blur();
    //resets any selected feature
    lastClickedFeature.setStyle(styleFunction);
    lastClickedFeature = null;
    
    return false;
};


//initialize the map
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.Stamen({
                layer: 'toner-lite' 
            })
        }),
        segmentLayer,
        terminalLayer
    ],
    view: new ol.View({
        //center: ol.proj.fromLonLat([-112, 38]),
        center: [-9099568, 4192168],
        zoom: 3,
        projection: 'EPSG:3857',
        enableRotation: false
    })
});
$('.ol-zoom-out').each(function() {
    $(this).innerHTML = '-'
});
map.addOverlay(overlay);


//adding scale bar, zoomslider
var scale = new ol.control.ScaleLine();
var zoomslider = new ol.control.ZoomSlider();
map.addControl(scale);
map.addControl(zoomslider);


//working on a custom control that allows the user to perform queries, make and clear selections
var button = document.createElement('button');
button.innerHTML = 'Query/Download Map Data';
button.id = 'perform-queries';
button.className = 'accordion';


//this object will contain information about which queries are active
var query_tracker = new Object();
//these are the css rules for collapsing and expanding
var collapse = {
    'max-height': '0',
    'transition': 'max-height 0.3s ease-out',
    'overflow': 'hidden'
}
var expand = {
    'max-height': '1000px',
    'transition': 'max-height 0.3s ease-in'
}



//building the actual query tools. starting with the segments control
var segment_header = document.createElement('button');
segment_header.innerHTML = 'Query Segments';
var segment_state = buildStateSelect(segmentLayer, 'Segments by state: ', ['seg_terminal1_state', 'seg_terminal2_state'], 'segment_state');
var segment_passengers = buildSlider(segments, segmentLayer, 'passengers', 'Number of annual passengers', 'segment_passengers');
var segment_vehicles = buildSlider(segments, segmentLayer, 'vehicles', 'Number of annual vehicle boardings', 'segment_vehicles');
var segment_length = buildSlider(segments, segmentLayer, 'seg_length', 'Length in nautical miles', 'segment_length');
var segment_vessels = buildSlider(segments, segmentLayer, 'number_vessels', 'Number of vessels in operation', 'segment_vessels');
var purpose_values = [ "trip_purpose_commuter_transit", "trip_purpose_pleasure", "trip_purpose_emergency", 
"trip_purpose_roadway_conn", "trip_purpose_lifeline", "trip_purpose_nps", "trip_purpose_other"];
var purpose_labels = ['Commuter Transit', 'Pleasure', 'Emergency', 'Roadway Connector', 'Lifeline', 'National Park', 'Other'];
var segment_purpose = buildMultiSelect(segmentLayer, 'Trip purpose: ', purpose_labels, purpose_values, 'purpose_multiselect');

var segment_div = document.createElement('div');
$(segment_div).append(segment_header, segment_state, segment_purpose, segment_passengers, segment_vehicles, segment_length, 
segment_vessels);

$(segment_header).click(function () {
    collapsibleChildren(segment_div)
});
//storing properties in the html element...quite clever if i do say so myself
$(segment_div).data('isOpen', false);
$($(segment_div).children()).slice(1).css(collapse);




//terminals control 
var terminal_header = document.createElement('button');
terminal_header.innerHTML = 'Query Terminals';
var terminal_names = buildSelect(terminals, terminalLayer, 'terminal_name', 'Terminal Name: ', pointHoverStyle);
var terminal_state = buildStateSelect(terminalLayer, 'Terminals by state: ', ['term_state'], 'terminal_state');
var modal_labels = ['Parking', 'Local Bus', 'Intercity Bus', 'Local Rail', 'Intercity Rail'];
var transpo_values = ['parking', 'local_bus', 'intercity_bus', 'local_rail', 'intercity_rail'];
var terminal_transportation = buildMultiSelect(terminalLayer, 'Transportation connections: ', modal_labels, 
transpo_values, 'transporation_multiselect');
var terminal_op_num = buildOpSelect();

var terminal_div = document.createElement('div');
$(terminal_div).append(terminal_header, terminal_state, terminal_transportation, terminal_op_num);
$(terminal_header).click(function () {
    collapsibleChildren(terminal_div)
});
$(terminal_div).data('isOpen', false);
$($(terminal_div).children()).slice(1).css(collapse);


//downloads menu
var download_center = document.createElement('div');
var download_buttons = downloadCenter()
$(download_center).append(download_buttons[0], download_buttons[1]);
$(download_buttons[0]).click(function () {
    collapsibleChildren(download_center)
})
$(download_center).data('isOpen', false);
$($(download_center).children()).slice(1).css(collapse);

//clearing queries
var clear_queries = document.createElement('button');
clear_queries.innerHTML = 'Clear all queries';
clear_queries.addEventListener('click', function () {
    //reset = true indicates that the control will have its values reset to the defaults
    clearQueryTracker(true);
}, false);
clear_queries.id = 'clear';


//tying it all together
var children = [segment_div, terminal_div, download_center, clear_queries];
var dashboard_children = document.createElement('div');
dashboard_children.id = 'dashboard_children';

//adding margins to the child elements of the custom control
for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child !== clear_queries) {
        $(child).children()[0].className = 'accordion';
    }
    dashboard_children.appendChild(child);
}
$(dashboard_children).css(collapse);



//keeps track of whether the dashboard is open
var dashboardIsOpen = false;
//expands and retracts dashboard on clicks by changing the style setting of the child element
var createDashboard = function() {
    //toggle classes so that the style looks good in motion
    button.classList.toggle('active')
    
    if (dashboardIsOpen) {
        dashboardIsOpen = false;
        $('#query-control').toggleClass('scroll-disappear');
        button.innerHTML = 'Query/Download Map Data';
        button.id = 'perform-queries';
        $(dashboard_children).css(collapse);
    } else {
        button.innerHTML = 'Close Menu';
        button.id = 'close-menu';
        dashboardIsOpen = true;
        $(dashboard_children).css(expand);

        //the multiselect placeholder attribute has bizarre behvaior, so i'm just going to call it here
        $("select").select2({
            placeholder: "Select options"
        });

        //this switches the scrollbar functionality on after a 50 ms delay, which
        //prevents it from rendering then un-rendering during expansion. yay
        setTimeout(function () {
            $('#query-control').toggleClass('scroll-disappear');
        }, 50);
        
    }
    
};

//this function makes the child sections of the custom control collapsible as well
function collapsibleChildren(parent) {
    var children = $(parent).children();
    //everything other than the button that will be the collapse control
    var c_children = $(children).slice(1);
    //replaces the plus sign with a minus sign and vice versa
    $(children[0]).toggleClass('active');

    if ($(parent).data('isOpen')) {
        $(parent).data('isOpen', false); 

        var collapse_small = collapse;
        collapse_small['transition'] = 'max-height 1s ease-out'
        $(c_children).css(collapse);
        
        if (parent === segment_div) {
            $('.sliderValue.maxbox').css({
                'position': 'relative'
            });
        }
        $(c_children).css({'margin-bottom': '0px'});
    } else {
        $(parent).data('isOpen', true);
        var expand_small = expand;
        expand_small['max-height'] = '1000px'
        $(c_children).css(expand_small);
        $(c_children).css({'margin-bottom': '3px'});
    }
}

button.addEventListener('click', createDashboard, false);
var element = document.createElement('div');
element.className = 'custom-control ol-unselectable ol-control';
element.id = 'query-control';
element.appendChild(button);
//creates the query dashboard
var queryControl = new ol.control.Control({
    element: element
});
map.addControl(queryControl);
queryControl.element.appendChild(dashboard_children);



//stores info about the last clicked feature
var lastClickedFeature;
//stores info about features that have been highlighted based on a selection
var selectedFeatures = [];

function createPopup (evt, feature, make_popup) {
    var coord = evt.coordinate;
    //variable to store the header text
    var header = document.createElement('p');
    header.id = 'popup-header';

    if (feature.get('segment_id')) {
        feature.setStyle(lineHoverStyle);

        if (make_popup === true) {
            header.innerHTML = 'Segment ' + feature.get('segment_id') + ': ' + feature.get('segment_name');
            
            var text = '<p>Operated by ' + feature.get('op_name') + '</p><p>' +
            'Trips per year: ' + numParser(feature.get('trips_per_year')) + '</p><p>Passenger boardings: ' 
            + numParser(feature.get('passengers')) 
            + '</p><p>Vehicle boardings: ' + numParser(feature.get('vehicles')) + '</p>';
        }
    } else {
        pointHoverStyle.image_.setRadius(getRadiusFromZoom());
        feature.setStyle(pointHoverStyle);
    
        if (make_popup === true) {
            header.innerHTML = 'Terminal ' + feature.get('terminal_id') + ': ' + feature.get('terminal_name');
            var text = '<p>Parking ' + connection(feature.get('parking'), true) + '</p><p>Local bus: ' + connection(feature.get('local_bus'), false) +
            '</p><p>Intercity bus: ' + connection(feature.get('intercity_bus'), false) + "</p><p>Local rail: " + connection(feature.get('local_rail'), false) +
            '</p><p>Intercity rail: ' + connection(feature.get('intercity_rail'), false) +  
            '</p> <button onclick = "highlightRoutes(' + feature.get('terminal_id') + ')">Highlight all routes</button>';
            
        }
    }

    if (make_popup === true) {
        //set the header value, add text to popup box
        if ($('#popup-header-div').children().length === 0) {
            popup_header.appendChild(header);
        } else {
            //if the focus is now on another feature, i need to replace the text in the header
            if ($('#popup-header-div').children()[0].innerHTML != header.innerHTML) {
                popup_header.removeChild(document.getElementById('popup-header'));
                popup_header.appendChild(header)
            }
        }

        content.innerHTML = text;
        overlay.setPosition(coord);
    }
}

//handling some map interactions. creating/anchoring popups on clicks
map.on('click', function(evt) {
    //mouse goes from hover to click in many cases with no change for the pointer
    //to change back after the hover ends. this line handles that
    this.getTargetElement().style.cursor = 'default';
    var feature = map.forEachFeatureAtPixel(evt.pixel, 
        function(feature) {
            return feature;
        });
    //resets the feature's color on the next click
    if (lastClickedFeature) {
        lastClickedFeature.setStyle(styleFunction);
        lastClickedFeature = null;
    }
    //reset selected features
    if (selectedFeatures.length > 0) {
        for (var i = 0; i < selectedFeatures.length; i++) {
            selectedFeatures[i].setStyle(styleFunction);
        }
        selectedFeatures = [];
    }
    //determines the feature type, which is the basis for popup configuration
    if (feature) {
        createPopup(evt, feature, true);
        lastClickedFeature = feature;
        return true
    } else {
        lastClickedFeature = null;
    }
});

//store values for the last hovered-over feature here so that they can be reset later
var lastFeature;
//event handler for each time the mouse moves
//acts as a handler for hovers over features on the map
map.on('pointermove', function(evt) {
    this.getTargetElement().style.cursor = 'default';
    //select feature, assign the last feature selected
    var feature = map.forEachFeatureAtPixel(evt.pixel, 
        function(feature) {
            if (lastFeature == null) {
                lastFeature = feature;
            }
            //makes sure that selected features aren't affected by the hover
            if (selectedFeatures.includes(feature)) {
                return false;
            } else {
                return feature;
            }
        });

    if (feature) {
        this.getTargetElement().style.cursor = 'pointer';
        if (lastFeature != null && lastFeature != feature && (lastFeature != lastClickedFeature || lastClickedFeature == null)) {
            lastFeature.setStyle(styleFunction);
        }
        //cursor changes to pointer when features are hovered over
        this.getTargetElement().style.cursor = 'pointer';
        
        if (lastClickedFeature == null) {
            createPopup(evt, feature, true);
        } else {
            createPopup(evt, feature, false);
        }
        lastFeature = feature;
    } else {
        //reset style for the feature that is no longer hovered over
        if (lastFeature != null && lastFeature != lastClickedFeature) {
            lastFeature.setStyle(styleFunction);
        }
        //close any popups that are present (except those which belong to features that were clicked on)
        if (lastClickedFeature == null) {
            overlay.setPosition(undefined);
            closer.blur(); 
            return false
        }
    }
});
        
//change cursor when the user drags the map
map.on('pointerdrag', function() {
    this.getTargetElement().style.cursor = 'move';
});

//changes radius of terminals if the zoom threshold for change has been reached
map.on('moveend', function() {    
    image.image_.setRadius(getRadiusFromZoom());
})

//dynamically set the radius of the terminal features based on the zoom level. 
//the terminals get bigger as they 
function getRadiusFromZoom() {
    if (!map) {
        return 3.25
    } else {
        var zoom = map.getView().getZoom();

        if (zoom < 4) {
            return 2.65
        } else {
            if (zoom < 6 && zoom >= 4) {
                return 3.25
            } else {
                if (zoom >= 6 && zoom < 10) {
                    return 4.25
                } else {
                    if (zoom >= 10 && zoom < 13) {
                        return 5
                    } else {
                        if (zoom >= 13) {
                            return 6
                        }
                    }
                }   
            }
        }
    }
}
//a bunch of misc functions that need to be organized better

//this function highlights all the routes that either end or begin at the selected terminal
function highlightRoutes(id) {
    var features = segmentLayer.getSource().getFeatures();
    
    //loop through all features and find those that have matching terminal ids
    for (var i = 0; i < features.length; i++) {
        if (features[i].get('seg_terminal1_id') == id || features[i].get('seg_terminal2_id') == id) {
            features[i].setStyle(lineHoverStyle);
            selectedFeatures.push(features[i])
        }
    }
}


//pass a layer (geojson var, not an OL layer) and a field to get a list of all the unique values
function uniqueValues(layer, field) {
    var features = layer.features;
    var values = [];

    for (var i = 0; i < features.length; i++) {
        if (values.indexOf(features[i].properties[field]) === -1) {
            values.push(features[i].properties[field]);
        }
    }
    return values.sort();
}

//for a given field in a layer, this function returns an array with the minimum and maximum 
//values at indices 0 and 1, respectively
function getRangeOfValues(layer, field) {
    var values = []
    var features = layer.features;

    for (var i = 0; i < features.length; i++) {
        var num = parseInt(features[i].properties[field]);
        if (values.indexOf(num) === -1 && !isNaN(num)) {
            values.push(num);
        }
    }
    //sort numbers in ascending order
    values = values.sort(function(a, b) {return a - b});
    return [values[0], values.slice(-1)[0]];
}

//this function returns a string that is sent to the terminals popup 
//the string tells whether the terminal has connections to different transit modes
//the json contains boolean values that are passed as the feaure arg

function connection(feature, parking) {
    if (parking) {
        if (feature) {
            return 'available';
        }
        else {
            return 'not available';
        }
    } else {
        if (feature) {
            return 'connection available';

        }
        else {
            return 'no connection';
        }
    }
}

//this function returns a value to pass to the routes popup. if the boardings are null, it 
//passes N/A. otherwise, it passes the number with commas separating each three digits
function numParser(feature) {
    
    if (feature) {
        feature = String(feature);
        var counter = 0;
        var num_fmt = [];
        for (var i = feature.length - 1; i > -1; i--) {
            if (counter === 3) {
                num_fmt.unshift(',');
                counter = 0;
            }
            num_fmt.unshift(feature[i]);
            counter ++;
        }
        return num_fmt.join("")
    } else {
        return 'N/A';
    }
}


//downloads queried features to the user's computer as a geojson
function downloadGeojson (file_name, layer, query) {
    var features = getQueriedFeatures(layer, query);
    var transformedFeatures = features;

    //prevents a download from taking place if there is no selection
    if (transformedFeatures.length > 0) {
        for (var i = 0; i < transformedFeatures.length; i++) {
            //reprojecting back to degree-based coordinates
            coords = transformedFeatures[i].getGeometry().transform('EPSG:3857', 'EPSG:4326');
            transformedFeatures[i].setGeometry(coords);
        }
        //creating JSON for the user to download
        var writer = new ol.format.GeoJSON();
        var queryJSON = writer.writeFeatures(transformedFeatures)
        
        download(queryJSON, file_name + '.json', 'text/plain');

        //i have to return the features back to their original coordinates for some reason. its unclear why 
        //the original features were affected. i assumed it was a copy
        for (var i = 0; i < transformedFeatures.length; i++) {
            coords = transformedFeatures[i].getGeometry().transform('EPSG:4326', 'EPSG:3857');
            transformedFeatures[i].setGeometry(coords);
        }
    }
}

//downloads the selected features to a csv file. for segments, it is not practical to 
//download the geometry
function downloadCSV (file_name, layer, query) {
    var csvContent = '';
    var features = getQueriedFeatures(layer, query);
    var values = features[0].values_;

    //column headers
    var cols = Object.keys(values).slice(1);
    csvContent += cols.join(',') + '\n';

    for (var i = 0; i < features.length; i++) { 
        var row = []
        for (var x = 0; x < cols.length; x++) {
            //double quotes allow the commas to be preserved without being treated as delimiters
            row.push('"' + features[i].values_[cols[x]] + '"');
        }
        csvContent += row.join(',') + '\n';
    }
    download(csvContent, file_name + '.csv', 'text/plain');

}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


//builds the query object, keeps track of what filters are active, overwrites a specific 
//filter if a user changed the parameters
function buildQueryTracker (query_type, query_function) {
    
    // if a specific filter already has parameters, they are overwritten. if not, the filter is created
    query_tracker[query_type] = query_function;
    //this function is called after any query is performed, it executes all active filters
    
    applyQueriesFromTracker();
}

//this function is called after the query tracker has been changed
//it loops through the queries and applies each one
function applyQueriesFromTracker () {
    //clears the last set of queries. if multiple queries are active, they will all be reapplied
    //except for the one that the user just adjusted
    clearQueries();

    //doing this because Object.values is ES6 and not IE friendly
    var functions = Object.keys(query_tracker).map(function(e) {
        return query_tracker[e];
    })
    
    for (var i = 0; i < functions.length; i++) {
        //actual execution of the function
        functions[i]();
    }
    segmentLayer.setStyle(styleFunction);
    terminalLayer.setStyle(styleFunction);
}

//queries feaures, removes features that do not match the query
function performQuery(layer, field, value, slide) {
    //making all field values an array so that the query can be performed on multiple fields
    //at once
    //these apply to the multiselect options which are based on booleans stored in different fields
    if (typeof(field) !== 'object') {
        var field = [[field]];
    } else {
        var field = [field];
    }
    
    if (typeof(value) !== 'object') {
        var value = [value];
    }    
    //clears previous selection
    var selectedFeatures = [];
    var selectedGeoms = [];
    var features = layer.getSource().getFeatures();
    //determine which features fulfill query, changes their styling
    //when multiple fields are queried (in the case of the transportation multiselect),
    //it loops over various field and filters the previously filtered values.
    for (var f = 0; f < field[0].length; f++) {
        for (var i = 0; i < features.length; i++) {

            //for the range sliders, i am passing an array of two values. the first 
            //is the lower bound and the second is the upper bound
            if (slide === true) {
                if (parseFloat(features[i].get(field[0][f])) >= value[0] && parseFloat(features[i].get(field[0][f])) <= value[1]) {
                    
                    selectedFeatures.push(features[i])
                } else {
                    features[i].hidden = true;
                }
            } else {
                for (var x = 0; x < value.length; x++) {
                    var val = value[x]
                    if (features[i].get(field[0][f]) == val) {
                        selectedFeatures.push(features[i]);
                    } 
                    
                }
            }
        }
        
    }
    //this if statement only applies to multiselects
    //this way, the multiselect operates on an "or" basis. ie it will query for features
    //that have parking OR bus connections, if those are the two selections made in the 
    //select box
    if (slide === false) {
        for (var i = 0; i < features.length; i ++) {
            //any feature that does not fulfill at least one of the fields queried in the multiselect
            //will be hidden
            if (selectedFeatures.indexOf(features[i]) === -1) {
                features[i].hidden = true;
            }
        }
    }

    //changes style for selected features, gathers their geometries 
    for (var i = 0; i < selectedFeatures.length; i++) {
        selectedGeoms.push(selectedFeatures[i].getGeometry());
    }

    //calculating the extent of the selected features so that the map can zoom in to them
    geoms = new ol.geom.GeometryCollection(selectedGeoms);
    extent = geoms.getExtent();
    
    //handles case where the query returns a single terminal. zooms out a bit
    if (extent[0] - extent[1] < 1) {
        extent[0] -= 150;
        extent[1] -= 150;
        extent[2] += 150;
        extent[3] += 150;
    }
    //zoom in to selected features
    //map.getView().fit(extent);
}

//this function is called when the user queries the features by states
//it zooms the map to the selected state(s). states_arr is a list of the state
//abbreviations
function fitMapToStates(states_arr) {
    var state_names = states['features']

    var lons = []
    var lats = []

    for (var i = 0; i < state_names.length; i++) {
        if (states_arr.includes(state_names[i]['properties']['STUSPS'])) {

            var coords = state_names[i]['geometry']['coordinates'][0];
            
            for (var x = 0; x < coords.length; x ++) {
                lons.push(coords[x][0]);
                lats.push(coords[x][1]);
            }
        }
    }
    //will create the bounding box
    var lon_min = Math.min.apply(Math, lons)
    var lon_max = Math.max.apply(Math, lons)
    var lat_min = Math.min.apply(Math, lats)
    var lat_max = Math.max.apply(Math, lats)

    var extent = [lon_min, lat_min, lon_max, lat_max];
    map.getView().fit(extent);
}

//this function builds a slider for the custom control
function buildSlider(layer_var, layer, field, preface, tool_name) {

    var range = getRangeOfValues(layer_var, field);
    
    var minbox = document.createElement('input');
    minbox.type = 'number';
    minbox.className = 'sliderValue';
    minbox.value = range[0];
    minbox.index = '0';
    minbox.min = minbox.value


    var maxbox = document.createElement('input');
    maxbox.type = 'number';
    maxbox.className = 'sliderValue maxbox';
    maxbox.value = range[1];
    maxbox.index = '1';
    maxbox.style.float = 'right';
    maxbox.min = minbox.value;
    maxbox.max = maxbox.value;
    minbox.max = maxbox.value;
    
    var slider = document.createElement('div');
    slider.className = 'slider';
    slider.style.height = '18px';
    slider.style['margin-bottom'] = '1px';
    slider.style.cursor = 'pointer';


    $(slider).slider({
        values: range,
        range: true,
        max: range[1],
        slide: function (event, ui)  {
            minbox.value = ui.values[0];
            maxbox.value = ui.values[1];

            for (var i = 0; i < ui.values.length; ++i) {
                $("input.sliderValue[index=" + i + "]").val(ui.values[i]);
            }

            buildQueryTracker(tool_name, function () {
                performQuery(layer, field, 
                [parseInt(minbox.value, 10), parseInt(maxbox.value, 10)], true);
            });
        }
    });

    function rangeChange(newRange) {
        $(slider).slider('values', 0, newRange[0]);
        $(slider).slider('values', 1, newRange[1]);
        buildQueryTracker(tool_name, function () {
            performQuery(layer, field, 
            [parseInt(minbox.value,10), parseInt(maxbox.value, 10)], true);
        });
    }

    //re-queries the segments when the user manually changes the input for min and max ranges
    $(minbox).on(
        'input',
        function () {
            rangeChange([$(minbox).val(), $(maxbox).val()]);
        }
    );
    $(maxbox).on(
        'input', 
        function () {
            rangeChange([$(minbox).val(), $(maxbox).val()]);
        }
    );

    //manipulating style of the handles on the slider
    var handles = slider.childNodes;
    handles[1].style['margin-left'] = '0em';
    handles[1].style.cursor = 'pointer';
    handles[2].style['margin-left'] = '-1.2em';
    handles[2].style.cursor = 'pointer';

    var div = document.createElement('div');
    div.style.width = 'auto';
    
    div.style['padding-right'] = '1px';

    var label = document.createElement('label');
    label.innerHTML = preface;

    
    div.appendChild(label);
    div.appendChild(slider);
    div.appendChild(minbox);
    div.appendChild(maxbox);

    //div.style['margin-right'] = '1px';

    return div;
}


//this function builds a query row to the custom control. it uses select boxes specifically
//layer_var should be one of the geojson vars. layer should be the OL layer based on that var
//layer should either be segments or terminals. field represents the field that 
//the select control will query. preface is a string that will contain the text
//that goes to the left of the select box. tool_name is how the tool will be represented in the query_tracker obj
function buildSelect(layer_var, layer, field, preface, tool_name) {
    var select = document.createElement('select');
    
    var values = uniqueValues(layer_var, field);

    //adds all the possible values to the selection list
    for (var i = 0; i < values.length; i++) {
        var option = document.createElement('option');
        option.value = values[i];
        option.selected = ''
        option.innerHTML = option.value;
        select.appendChild(option);
    }
    
    //tying together the various elements of the query into one cohesive div
    var div = document.createElement('div');
    div.className = 'query-row';

    var label = document.createElement('span');
    label.innerHTML = preface;

    div.appendChild(label);
    div.appendChild(select);

    var select_button = document.createElement('button');
    select_button.innerHTML = 'Go';
    select_button.addEventListener('click', function () {
        buildQueryTracker(tool_name,
            function() {
                performQuery(layer, field, select.value, false)
            }
        )},
    false);
        
    div.appendChild(select_button);

    //the div is returned as a whole
    return div;
}

//this function creates a multiselect div for transportation modes.
//layer is the ol object with the geojson data, preface is text next to the tool, labels are the labels 
//for the select options, values are the field names in the geojson assc. with each label,
// tool_name is how the tool will be represented in the query_tracker obj
function buildMultiSelect(layer, preface, labels, values, tool_name) {
    var select = document.createElement('select');
    select.multiple = "multiple";


    for (var i = 0; i < values.length; i++) {

        var option = document.createElement('option');
        option.value = values[i];
        option.innerHTML = labels[i]

        select.appendChild(option);
    }

    //tying together the various elements of the query into one cohesive div
    var div = document.createElement('div');
    div.className = 'query-row'

    var label = document.createElement('span');
    label.innerHTML = preface;

    $(select).select2({
        dropdownParent: $(div),
        multiple: true, 
        allowClear: true
    });

    
    var select_button = document.createElement('button');
    select_button.innerHTML = 'Go';
    select_button.addEventListener('click', function () {
        buildQueryTracker(tool_name, 
            function() {
                performQuery(layer, getMultipleSelections(select), true, false)
            }
        )}, 
    false);

    return buildMultiSelectRow(div, select, label, select_button);
}

//this function builds a select control for features by state
//fields is a list of the fields that will be included in the query (1 for terminals, 2 for segments)
function buildStateSelect (layer, preface, fields, tool_name) {
    var select = document.createElement('select');
    select.multiple = "multiple";

    var values = uniqueValues(segments, 'seg_terminal1_state');
    //any state values that may be missing from the first field are added to make a 
    //complete list
    var values2 = uniqueValues(segments, 'seg_terminal2_state');
    for (var i = 0; i < values2.length; i++) {
        if (values.indexOf(values2[i]) === -1) {
            values.push(values2[i]);
        }
    }

    //add the state labels to the dropdown that pops up when the user clicks on the selct box
    for (var i = 0; i < values.length; i++) {
        var option = document.createElement('option');
        option.value = values[i];
        option.innerHTML = values[i]
        select.appendChild(option);
    }

    //tying together the various elements of the query into one cohesive div
    var div = document.createElement('div');
    div.className = 'query-row'

    var label = document.createElement('span');
    label.innerHTML = preface;

    $(select).select2({
        dropdownParent: $(div),
    });
     
    var select_button = document.createElement('button');
    select_button.innerHTML = 'Go';
    select_button.addEventListener('click', function () {
        
        var states = getMultipleSelections(select);
        
        buildQueryTracker(tool_name, 
            function() {
                performQuery(layer, fields, states, false)
            }
        );
        
        fitMapToStates(states);
    }, 
    false);
    
    return buildMultiSelectRow(div, select, label, select_button);
}


//helper function that is called by a couple of the row constructors to build
//a nicely aligned, table-formatted row of elements the user can interact with.
function buildMultiSelectRow (div, select, label, select_button) {
    
    var table = document.createElement('table');
    var row = document.createElement('tr');
    

    var label_row = document.createElement('td');
    label_row.appendChild(label);

    var select_row = document.createElement('td');
    select_row.appendChild(select);

    var button_row = document.createElement('td');
    button_row.appendChild(select_button);

    row.appendChild(label_row);
    row.appendChild(select_row);
    row.appendChild(button_row);

    table.appendChild(row);
    table.style.width = '100%'

    label_row.className = 'multiselect-cell';
    button_row.className = 'multiselect-cell';


    div.appendChild(table);
    $(select).select2({dropdownParent: $(select_row)});

    //the div is returned as a whole
    return div;
}

//builds a select tool that queries whether the terminals have multiple operators
function buildOpSelect() {
    var tool_name = 'terminal_operator_ct'
    var toggles = document.createElement('div');
    var label = document.createElement('label');
    label.innerHTML = 'Number of terminal operators: ';
    label.style.marginRight = '40px';
    toggles.appendChild(label);

    //text is the label desired next to the toggle
    //hasMultOps is a boolean that declares whether the terminal has multiple operators
    function buildToggle() {
        var span = document.createElement(span);
        var box = document.createElement('label');
        var toggle = document.createElement('input');
        toggle.className = 'toggle';
        toggle.checked = true;
        
        var slider = document.createElement('span');
        slider.className = 'toggle-slider round'

        toggle.type = 'checkbox';
        box.appendChild(toggle);
        box.appendChild(slider);
        box.className = 'switch';

        span.appendChild(box);
        toggles.appendChild(span);

        return toggle;
    }

    function labelMaker(text) {
        var label = document.createElement('label');
        label.innerHTML = text;
        label.style.marginLeft = '2px';
        label.style.marginRight = '40px';
        return label;
    }

    var t1 = buildToggle();
    var lab1 = labelMaker('One');
    toggles.appendChild(lab1);

    var t2 = buildToggle();
    var lab2 = labelMaker('Multiple');
    lab2.style.marginRight = '0px';
    toggles.appendChild(lab2);
    
    t1.checked = true;
    t2.checked = true;


    //sets up toggle controls so that when they are toggled on/off, the terminals are queried
    $(toggles).on(
        'click', 
        function () {
            //determining which toggles are checked
            if (t1.checked && t2.checked) {
                var vals = [0, 1];
            } else {
                if (t1.checked || t2.checked) {
                    if (t2.checked) {
                        var vals = 1;
                    } else {
                        var vals = 0;
                    }
                } else {
                    var vals = -1;
                }
            }
            buildQueryTracker (tool_name, 
                function() {
                    performQuery(terminalLayer, 'multiple_operators', vals, false); 
                }
            );  
        }
    );
        
    return toggles
}


//this function determines all the values that a user selected from a select element,
//which is denoted by the var select
function getMultipleSelections(select_box) {
    var result = [];
    var selections = $(select_box).select2('data');
    for (var i = 0; i < selections.length; i++) {
        result.push(selections[i].id);
    }
    return result;
}

//for a given layer, this function returns all features that have passed
//through multiple queries, ie they are not hidden
//returned features are sent to the geojson/csv downloads
function getQueriedFeatures(layer, query) {

    if (query === false) {
        return layer.getSource().getFeatures();
    } else {
        var features = layer.getSource().getFeatures();
        var query_features = [];
        
        for (var i = 0; i < features.length; i ++) {
            if (features[i].hidden) {
            } else {
                query_features.push(features[i]);
            }
        }
        return query_features;
    }
}

//sets the hidden property for all features back to false, in essense clearing
//all queries 
function clearQueries () {
    var layers = [segmentLayer, terminalLayer];

    for (var layer = 0; layer < layers.length; layer ++) {
        var features = layers[layer].getSource().getFeatures();

        for (var i = 0; i < features.length; i++) {
            if (features[i].hidden) {
                features[i].hidden = false;
            }
        }
    }
}

//this function clear queries out of the tracker when the user presses the 
//clear queries button. reset indicates whether the controls will reset to their
//original values
function clearQueryTracker(reset) {
    

    for (var i = 0; i < Object.keys(query_tracker).length; i++) {
        var tracker = Object.keys(query_tracker)[i]
        delete query_tracker[tracker];
    }
    clearQueries();
    segmentLayer.setStyle(styleFunction);
    terminalLayer.setStyle(styleFunction);

    if (reset == true) {
        
        //re-check toggles
        var toggles = document.getElementsByClassName('toggle');

        for (var i = 0; i < toggles.length; i++) {
            var toggle = toggles[i]
            toggle.checked = true;
        }
        
        
        //reset slider inputs to min and max values
        var slider_inputs = document.getElementsByClassName('sliderValue');
        
        for (var i = 0; i < slider_inputs.length; i++) {
            var input = slider_inputs[i]
            if (input.index === '0') {
                input.value = input.min;
            } else {
                input.value = input.max;
            }
        }
        
        //rest slider handle locations
        var sliders = document.getElementsByClassName('slider');
        
        for (var i = 0; i < sliders.length; i++) {
            var slider = sliders[i]
            var div = slider.parentElement.childNodes;
            $(slider).slider('values', 0, parseInt(div[2]['min']));
            $(slider).slider('values', 1, parseInt(div[2]['max']));
        }
        //clear multiselect boxes
        $('select').val(null).trigger('change');
        //the multiselect placeholder attribute has bizarre behvaior, so i'm just going to call it here
        $("select").select2({
            placeholder: "Select options"
        });
    }

}

//function that reduces lines of code and constructs the downlaod button controls for the queries
//feature type is the title case of Segments or Terminals
function downloadButton (feature_type, layer) {
    //building buttons, attach download event, add buttons to div
    var download_geo = document.createElement('button');
    download_geo.className = 'download-query';
    download_geo.innerHTML = feature_type + '.geojson';
    download_geo.addEventListener('click', function () {downloadGeojson (feature_type, layer, query = isQueryChecked())}, false);
    download_geo.style.background = '#777b7e';
    //download_geo.style.left = '3px';

    var download_csv = document.createElement('button');
    download_csv.className = 'download-query';
    download_csv.innerHTML = feature_type + '.csv';
    download_csv.addEventListener('click', function () {downloadCSV(feature_type, layer, query = isQueryChecked())}, false);
    download_csv.style.background = '#777b7e';

    download_csv.style.float = 'right';

    var download_control = document.createElement('div');
    download_control.style.width = 'auto';
    var buttons = [download_geo, download_csv];

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].style.width = '49.8%';
        buttons[i].style.display = 'inline';
        download_control.appendChild(buttons[i]);
    }

    return download_control;
}

//creates a button that expands when clicked to give the user download options
function downloadCenter () {
    var download = document.createElement('button');
    download.innerHTML = 'Download Data';
    download.className = 'collapsible';
    //create download controls, add to div that is collapsible
    var div = document.createElement('div');
    var download_seg = downloadButton('Segments', segmentLayer);
    var download_term = downloadButton('Terminals', terminalLayer);
    
    var query_checkbox = document.createElement('input');
    query_checkbox.setAttribute('type', 'checkbox');
    query_checkbox.id = 'query_checkbox';
    query_checkbox.checked = true;

    var label = document.createElement('label');
    label.innerHTML = 'Only include filtered results';
    label.for = 'query_checkbox';
    
    div.appendChild(query_checkbox);
    div.appendChild(label);
    div.appendChild(download_seg);
    div.appendChild(download_term);

    return [download, div];
}

function isQueryChecked() {
    return document.getElementById('query_checkbox').checked;
}