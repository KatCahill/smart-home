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

// Extract the SecurityService from the loaded package definition
const SecurityService = smart_security.Smart_security.SecurityService;


// Load the Protocol Buffer file for Smart Lighting
var assistantProtoPath = __dirname + "/protos/smart_assistant.proto";
var assistantPackageDefinition = protoLoader.loadSync(assistantProtoPath);
var smart_assistant = grpc.loadPackageDefinition(assistantPackageDefinition);

// Extract the SmartAssistantService from the loaded package definition
const SmartAssistantService = smart_assistant.Assistant.SmartAssistantService;


// Create a gRPC client for Smart Heating service
const heatingClient = new HeatingService("localhost:40000", grpc.credentials.createInsecure());

// Create a gRPC client for Smart Lighting service
const lightingClient = new LightingService("localhost:40000", grpc.credentials.createInsecure());

// Create a gRPC client for Security service
const client = new SecurityService('localhost:40000', grpc.credentials.createInsecure());

// Create a gRPC client for SmartAssistantServiceservice
var assistantClient = new SmartAssistantService("0.0.0.0:40000", grpc.credentials.createInsecure());


//SMART HEATING - ADJUST AMBIENT TEMPERATURE
// Define client-side functions
function adjustTemperature() {
  const input = readlineSync.question('Enter the desired ambient temperature in °C: ');
  const temperature = parseFloat(input);

  if (isNaN(temperature)) {
    console.error('Error: Invalid temperature value. Please enter a valid numeric value for the temperature in °C.');
    menu();
    return;
  }

  const request = { temperature };

  heatingClient.adjustTemperature(request, (error, response) => {
    if (error) {
      console.error('Error:', error.message); //Log error message received from the server
    } else {
      console.log('Status:', response.status); // log status returned by server
    }
    menu(); //go back to the meny
  });
}

//SMART HEATING - GET TEMPERATURE
function getRoomTemperatures() {
  try {
    //Establish a gRPC call to retrieve room temperatures
    const call = heatingClient.getRoomTemperatures({});

    // Handle data received from the server
    call.on('data', function(roomTemperature) {
      // Log toom temperature data received from the server
      console.log(`Room: ${roomTemperature.roomId}, Temperature: ${roomTemperature.temperature}°C`);
    });

    //Handle errors that occur during the streaming process
    call.on('error', function(error) {
      //Log client-errors
      console.error('Client Error:', error.message);
    });

    //Handle the end of the server stream
    call.on('end', function() {
      // Log that server stream has ended
      console.log('Server stream ended');
      menu();
    });
  } catch (error) {
    // Catch any synchronous error that occur during the establishment of the gRPC call
    console.error('Client Error:', error.message);
  }
}



//SMART LIGHTING
function setLighting() {
  const profileId = readlineSync.question('Enter the lighting profile ID (Daytime, Nightime, Bedtime): ');
  const brightness = parseFloat(readlineSync.question('Enter the desired brightness level (1-20): '));
  const duration = parseFloat(readlineSync.question('Enter the duration in hours for which the lighting profile will be used: '));

  const call = lightingClient.setLighting((error, response) => {
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log(`Status: Lighting profile set to ${profileId}, Brightness set to ${response.status}, Duration set to ${duration} hours`);
    }
    menu();
  });

  call.write({ profileId, brightness, duration});
  call.end();
}

//SMART SECURITY
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

//SMART ASSISTANT
// Function to start a conversation with the smart assistant
async function converse() {
  console.log("Starting conversation with Alexa...");

  // Continuously prompt the user for input
  while (true) {
    // Prompt the user to enter a query
    const query = readlineSync.question('You: ');

    // If the user enters "goodbye", end the conversation
    if (query.toLowerCase() === 'goodbye') {
      console.log("Conversation with Alexa ended.");
      // Return control back to the menu
      menu();
      return;
    }

    // Send the user query to the server and wait for the response
    const response = await sendRequest(query);

    // Print the response from the server
    console.log("Alexa:", response);
  }
}

// Function to send a request to alexa and receive the response
function sendRequest(query) {
  return new Promise((resolve, reject) => {
    const responseStream = assistantClient.converse(); // Start the streaming call

    // Send the user query to the server
    responseStream.write({ message: query });

    // Receive the response from the server
    responseStream.on('data', (response) => {
      // Resolve the promise with the response
      resolve(response.message);
    });

    // Handle errors
    responseStream.on('error', (error) => {
      reject(error);
    });
  });
}

// Start the menu
menu();

// Function to display the menu options
async function menu() {
  console.log("\n1. Smart Heating - Adjust Temperature\n2. Smart Heating - Get Temperature\n3. Smart Lighting\n4. Smart Security\n5. Smart Assistant\n6. Exit");
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
      const deviceId = readlineSync.question('Enter the device ID: ');
      streamSecurityEvents(deviceId);
      break;
    case 5:
      // Start the conversation with the assistant
      await converse();
      break;
    case 6:
      process.exit();
      break;
    default:
      console.log("Invalid choice. Please enter a number between 1 and 6.");
      await menu(); // Using await to wait for the asynchronous menu function call
  }
}
