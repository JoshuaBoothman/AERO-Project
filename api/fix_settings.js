const fs = require('fs');
const content = fs.readFileSync('local.settings.json', 'utf8');
try {
    const json = JSON.parse(content);
    console.log("JSON parsed. Keys in root: " + Object.keys(json));
    console.log("Keys in Values: " + (json.Values ? Object.keys(json.Values) : 'Values is missing'));

    if (json.Values && json.Values.SQL_CONNECTION_STRING) {
        console.log("SQL_CONNECTION_STRING is present in Values.");
    } else {
        console.error("SQL_CONNECTION_STRING is NOT in Values.");
        // Check if it's in root
        if (json.SQL_CONNECTION_STRING) {
            console.error("SQL_CONNECTION_STRING is in ROOT (Incorrect location).");
        }
    }
} catch (e) {
    console.error("Parsing failed: " + e.message);
}
