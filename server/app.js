const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readline = require('readline');


var{createServer} = require("http");
var{ Server } = require("socket.io");

var httpServer=createServer((req, res) =>{

});

var io = new Server(httpServer, {
  cors:{
    origin:'*',
    methods: '*'
  }
});

io.on("connection", function(socket){
  console.log(`connect ${socket.id}`);
});

httpServer.listen(8080)

// Load Smart Heating Protocol Buffer File
const heatingProtoPath = __dirname + "/protos/smart_heating.proto";

//Load proto file
const heatingPackageDefinition = protoLoader.loadSync(heatingProtoPath);
const smart_heating = grpc.loadPackageDefinition(heatingPackageDefinition).heating

// Load Smart Lighting Protocol Buffer File
const lightingProtoPath = __dirname + "/protos/smart_lighting.proto";

//Load proto File
const lightingPackageDefinition = protoLoader.loadSync(lightingProtoPath);
const smart_lighting = grpc.loadPackageDefinition(lightingPackageDefinition).lighting

// Load Smart Security Protocol Buffer File
const securityProtoPath = __dirname + "/protos/smart_security.proto";

//Load proto File
const securityPackageDefinition = protoLoader.loadSync(securityProtoPath);
const smart_security = grpc.loadPackageDefinition(securityPackageDefinition).Smart_security;

// Load Smart Security Protocol Buffer File
var assistantProtoPath = __dirname + "/protos/smart_assistant.proto";

//Load proto File
var assistantPackageDefinition= protoLoader.loadSync(assistantProtoPath);
var smart_assistant= grpc.loadPackageDefinition(assistantPackageDefinition).Assistant;

//SMART HEATING - ADJUST TEMPERATURE
// Implement the gRPC service methods for smart heating
const adjustTemperature = (call, callback) => {
const temperature = call.request.temperature; // extracts temperature from the client.

  // Simulate adjusting temperature (for demonstration purposes)
  console.log(`Adjusting ambient temperature to ${temperature}°C`);
  callback(null, { status: `Ambient temperature adjusted successfully to ${temperature}°C` });
};


//SMART HEATING - GET TEMPERATURE
const getRoomTemperatures = (call) => {
  // Simulated room temperatures with room IDs
  const roomTemperatures = [
    { roomId: 'Bedroom 1', temperature: 20.3 },
    { roomId: 'Bedroom 2', temperature: 22.8 },
    { roomId: 'Bedroom 3', temperature: 23.6 },
    { roomId: 'Dining Room', temperature: 22.5 },
    { roomId: 'Kitchen', temperature: 23.8 },
    { roomId: 'Sitting Room', temperature: 23.7}
  ];

  // Sending room temperature to the client
  roomTemperatures.forEach(roomTemperature => {
    const message = { roomId: roomTemperature.roomId, temperature: roomTemperature.temperature };
    call.write(message); // Send each room temperature to the client
  });

  call.end(); // Close the stream
  // Print message indicating that temperature data is being sent to client
  console.log("Temperature for living spaces sending to client")
};


//SMART LIGHTING
// Implement the gRPC service methods for smart lighting
const setLighting = (call, callback) => {
  let brightness = 0;
  let lightingProfile = ''; // Store lighting profile ID
  let duration = 0; // Store duration of lighting profile usage

  call.on('data', (profile) => {
    lightingProfile = profile.profileId; // Update lighting profile ID
    brightness = profile.brightness;
    duration = profile.duration; // Update duration
  });

  call.on('error', (error) => {
    console.error('Error:', error.message);
    callback(error); // Send error to client
  });

  call.on('end', () => {
    console.log('Client stream ended');

    // Send response to client including lighting profile and duration
    callback(null, { profileId: lightingProfile, status: brightness, duration: duration });
  });
};


//SMART SECURITY
// Function to stream security events
function streamSecurityEvents(call) {
  let deviceId; // Define deviceId variable outside the event handler

  call.on('data', (securityEvent) => {
    // Extract deviceId from the securityEvent
    deviceId = securityEvent.deviceId;

    // Log the received security event
    console.log(`Received security event from device ${deviceId}: ${securityEvent.eventType} - ${securityEvent.description}`);

    // Simulate processing and generating an alert
    const alert = {
      deviceId: deviceId,
      alertType: 'Intrusion Detected',
      message: 'Potential security breach detected!',
    };

    // Send the alert back to the client
    call.write(alert);
  });

  call.on('end', () => {
    // Print a message when streaming has stopped
    console.log('Client stream ended');
  });
}


//SMART ASSISTANT
// Define the service methods for the SmartAssistant service
const converse = (call) => {
  call.on('data', (request) => {
    const query = request.message;
    console.log(`Katherine: ${query}`);

// Process the user's query and generate a response
let response;
switch (query.toLowerCase()) {
  case 'hello':
    response = 'Good morning Katherine! How can I help you today?';
    break;
  case 'what is the date today':
    response = new Date().toDateString();
    break;
  case 'what is the weather today':
    response = 'The weather today is sunny with a high temperature of 27 degrees Celsius and a low temperature of 10 degrees Celsius.';
    break;
  case 'what is the time':
    response = 'The current time is ' + new Date().toLocaleTimeString();
    break;
  case 'turn on kitchen light':
      response = 'Turning on Kitchen lights';
      break;
  default:
    response = 'Sorry, I did not understand your query.';
}

    // Send the response to the client
    call.write({ message: response });

    // Print the response on the server side
    console.log(`Alexa's response: ${response}`);
  });

  call.on('end', () => {
    console.log('Client stream ended');
    call.end();
  });
};


// Make a new gRPC server
const server = new grpc.Server();

// Add the service and implementations to the server
server.addService(smart_heating.HeatingService.service, { adjustTemperature, getRoomTemperatures });
server.addService(smart_lighting.LightingService.service, { setLighting });
server.addService(smart_security.SecurityService.service, {StreamSecurityEvents: streamSecurityEvents,});
server.addService(smart_assistant.SmartAssistantService.service, { converse });

// Start the gRPC server
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});
