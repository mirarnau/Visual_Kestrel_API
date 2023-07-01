var fs = require('fs');
var togeojson = require('togeojson');
var DOMParser = require('xmldom').DOMParser;
function kmlToGeoJSON(kmlFilePath, outputFilePath) {
    // Read the KML file
    var kmlData = fs.readFileSync(kmlFilePath, 'utf-8');
    // Parse the KML data
    var parser = new DOMParser();
    var kmlDoc = parser.parseFromString(kmlData, 'text/xml');
    // Convert KML to GeoJSON
    var geojsonData = togeojson.kml(kmlDoc);
    // Write the GeoJSON to a file
    fs.writeFileSync(outputFilePath, JSON.stringify(geojsonData));
}
// Specify the path to your KML file
var kmlFilePath = '/Users/arnaumirhurtado/Documents/TAMK/TFG Aero/Visual_Kestrel_API/files/spain/SUASpain200912.utf.kml';
// Specify the output file path for GeoJSON
var outputFilePath = '/Users/arnaumirhurtado/Documents/TAMK/TFG Aero/Visual_Kestrel_API/files/spain/geojson.json';
// Call the function to convert KML to GeoJSON
kmlToGeoJSON(kmlFilePath, outputFilePath);
