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

const securityProtoPath = __dirname + "/protos/smart_security.proto";
const packageDefinition = protoLoader.loadSync(securityProtoPath);
const smart_security = grpc.loadPackageDefinition(packageDefinition);

const SecurityService = smart_security.Smart_security.SecurityService;

// Create a gRPC client for Smart Heating service
const heatingClient = new HeatingService("localhost:40000", grpc.credentials.createInsecure());

// Create a gRPC client for Smart Lighting service
const lightingClient = new LightingService("localhost:40000", grpc.credentials.createInsecure());

const client = new SecurityService('localhost:40000', grpc.credentials.createInsecure());

// Define client-side functions
function adjustTemperature() {
  const input = readlineSync.question('Enter the desired temperature in °C: ');
  const temperature = parseFloat(input);

  if (isNaN(temperature)) {
    console.error('Error: Invalid temperature value. Please enter a valid numeric value for the temperature in °C.');
    menu();
    return;
  }

  const request = { temperature };

  heatingClient.adjustTemperature(request, (error, response) => {
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Status:', response.status);
    }
    menu();
  });
}

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

function setLighting() {
  const profileId = readlineSync.question('Enter the lighting profile ID: ');
  const brightness = parseFloat(readlineSync.question('Enter the desired brightness level: '));
  const duration = parseFloat(readlineSync.question('Enter the duration in minutes for which the lighting profile will be used: '));

  const call = lightingClient.setLighting((error, response) => {
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log(`Status: Brightness set to ${response.status}, Lighting profile set to ${profileId}, Duration set to ${duration} minutes`);
    }
    menu();
  });

  call.write({ profileId, brightness, duration});
  call.end();
}

// Main menu function
async function menu() {
  console.log("\n1. Adjust Temperature\n2. Get Room Temperatures\n3. Adjust Lighting Profile\n4. Stream Sensor Data to AC\n5. Exit");
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
      // Prompt the user to enter the device ID when choosing to stream security events
      const deviceId = readlineSync.question('Enter the device ID: ');
      streamSecurityEvents(deviceId);
      break;
    case 5:
      process.exit();
      break;
    default:
      console.log("Invalid choice. Please enter a number between 1 and 5.");
      await menu(); // Using await to wait for the asynchronous menu function call
  }
}

// Function to stream security events
function streamSecurityEvents(deviceId) {
  const call = client.streamSecurityEvents();
  let intervalId;

  // Function to start sending security events
  function startSendingEvents() {
    intervalId = setInterval(() => {
      const eventType = 'Motion Detected';
      const description = 'Motion detected in the backyard';

      const securityEvent = {
        deviceId: deviceId,
        eventType: eventType,
        description: description,
      };

      console.log(`Sending security event from device ${deviceId}: ${eventType} - ${description}`);
      call.write(securityEvent);
    }, 3000);
  }

  call.on('data', (alert) => {
    console.log(`Received security alert for device ${alert.deviceId}: ${alert.alertType} - ${alert.message}`);
  });

  // Start sending security events
  startSendingEvents();
  // Stop streaming after 10 seconds
    setTimeout(() => {
      stopStreaming();
    }, 10000);

    // Function to stop streaming security events
    function stopStreaming() {
      clearInterval(intervalId); // Stop the interval
      call.end(); // End the streaming
      console.log('Streaming stopped after 10 seconds');
      // Call the menu function again after streaming has stopped
      menu();
    }

    // Listen for the 'end' event from the client to stop streaming
    call.on('end', stopStreaming);




}

// Start the menu
menu();
