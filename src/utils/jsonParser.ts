import * as fs from 'fs';
import * as xml2js from 'xml2js';

// Read the KML file
const kmlFileContent = fs.readFileSync('/Users/arnaumirhurtado/Documents/TAMK/TFG Aero/Visual_Kestrel_API/files/spain/SUASpain200912.utf.kml', 'utf-8');

// Parse the KML content
xml2js.parseString(kmlFileContent, (error, result) => {
  if (error) {
    console.error('Error parsing KML:', error);
    return;
  }

  // Convert the parsed KML to JSON
  const jsonData = JSON.stringify(result, null, 2);

  // Save the JSON to a file
  fs.writeFileSync('/Users/arnaumirhurtado/Documents/TAMK/TFG Aero/Visual_Kestrel_API/files/spain/putput.json', jsonData);

  console.log('Conversion successful. JSON file saved.');
});