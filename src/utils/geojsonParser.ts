const fs = require('fs');
const togeojson = require('togeojson');
const DOMParser = require('xmldom').DOMParser;

function kmlToGeoJSON(kmlFilePath: string, outputFilePath: string) {
    // Read the KML file
    const kmlData = fs.readFileSync(kmlFilePath, 'utf-8');

    // Parse the KML data
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlData, 'text/xml');

    // Convert KML to GeoJSON
    const geojsonData = togeojson.kml(kmlDoc);

    // Write the GeoJSON to a file
    fs.writeFileSync(outputFilePath, JSON.stringify(geojsonData));
}

// Specify the path to your KML file
const kmlFilePath = '/Users/arnaumirhurtado/Documents/TAMK/TFG Aero/Visual_Kestrel_API/files/SUASpain202302.3D.kml';

// Specify the output file path for GeoJSON
const outputFilePath = '/Users/arnaumirhurtado/Documents/TAMK/TFG Aero/Visual_Kestrel_API/files/spain/geojson.json';

// Call the function to convert KML to GeoJSON
kmlToGeoJSON(kmlFilePath, outputFilePath);