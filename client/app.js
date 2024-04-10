const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readlineSync = require('readline-sync');

// Load the Protocol Buffer file for Smart Heating
const heatingProtoPath = __dirname + "/protos/smart_heating.proto";
const heatingPackageDefinition = protoLoader.loadSync(heatingProtoPath);
const smart_heating = grpc.loadPackageDefinition(heatingPackageDefinition);

// Extract the HeatingService from the loaded package definition
const HeatingService = smart_heating.heating.HeatingService;

// Load the Protocol Buffer file for Smart Lighting
const lightingProtoPath = __dirname + "/protos/smart_lighting.proto";
const lightingPackageDefinition = protoLoader.loadSync(lightingProtoPath);
const smart_lighting = grpc.loadPackageDefinition(lightingPackageDefinition);

// Extract the LightingService from the loaded package definition
const LightingService = smart_lighting.lighting.LightingService;


// Create a gRPC client for Smart Heating service
const heatingClient = new HeatingService("localhost:40000", grpc.credentials.createInsecure());

// Create a gRPC client for Smart Lighting service
const lightingClient = new LightingService("localhost:40000", grpc.credentials.createInsecure());

function adjustTemperature() {
  const input = readlineSync.question('Enter the desired temperature in °C: ');
  const temperature = parseFloat(input);

  // Validate the user input
  if (isNaN(temperature)) {
    console.error('Error: Invalid temperature value. Please enter a valid numeric value for the temperature in °C.');
    menu(); // Show the menu again
    return;
  }

  const request = { temperature };

  // Make the gRPC call to adjust temperature
  heatingClient.adjustTemperature(request, (error, response) => {
    if (error) {
      console.error('Error:', error.message); // Handle remote error
    } else {
      console.log('Status:', response.status);
    }
    menu();
  });

  // Log the temperature adjustment before making the gRPC call
  //console.log(`Adjusting temperature to ${temperature}°C`);
}

// Function to get room temperatures
function getRoomTemperatures() {
  const call = heatingClient.getRoomTemperatures({});
  call.on('data', function(roomTemperature) {
    console.log(`Room: ${roomTemperature.roomId}, Temperature: ${roomTemperature.temperature}°C`);
  });
  call.on('error', function(error) {
    console.error('Error:', error.message);
  });
  call.on('end', function() {
    console.log('Server stream ended');
    menu();
  });
}

// Function to set lighting profiles
function setLighting() {
  const profileId = readlineSync.question('Enter the lighting profile ID: ');
  const brightnessLevel = parseFloat(readlineSync.question('Enter the desired brightness level: '));

  // Send lighting profile data to the server
  call.write({ profileId, brightness: brightnessLevel });
  call.end(); // End the stream
}


// Main menu function
function menu() {
  console.log("\n1. Adjust Temperature\n2. Get Room Temperatures\n3. Adjust Lighting Profile\n4. Exit");
  const choice = parseInt(readlineSync.question('Enter your choice: '));

  switch (choice) {
    case 1:
      adjustTemperature();
      break;
    case 2:
      getRoomTemperatures();
      break;
    case 3:
      setLighting();
      break;
    case 4:
      process.exit();
      break;
    default:
      console.log("Invalid choice. Please enter a number between 1 and 4.");
      menu();
  }
}

// Start the application by calling the menu function
menu();
