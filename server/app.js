const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load Smart Heating Protocol Buffer File
const heatingProtoPath = __dirname + "/protos/smart_heating.proto";

//Load proto file
const heatingPackageDefinition = protoLoader.loadSync(heatingProtoPath);
const smart_heating = grpc.loadPackageDefinition(heatingPackageDefinition).heating

// Load Smart Lighting Protocol Buffer File
const lightingProtoPath = __dirname + "/protos/smart_lighting.proto";

//load proto File
const lightingPackageDefinition = protoLoader.loadSync(lightingProtoPath);
const smart_lighting = grpc.loadPackageDefinition(lightingPackageDefinition).lighting

// Load Smart AC Protocol Buffer File
const airconditioningProtoPath = __dirname + "/protos/smart_ac.proto";

//Load proto File
const airconditioningPackageDefinition = protoloader.loadSync(airconditioningProtoPath);
const smart_ac = grpc.loadPackageDefinition(airconditioningPackageDefinition).aircondition

// Implement the gRPC service methods for smart heating
const adjustTemperature = (call, callback) => {
  const temperature = call.request.temperature;
  //error handling
  if (isNaN(temperature)) {
    console.error('Invalid temperature value. Please enter a valid numeric value for the temperature in °C.');
    callback('Invalid temperature value', null); // Pass an error message to the callback
    return;
}

  // Simulate adjusting temperature (for demonstration purposes)
  console.log(`Adjusting temperature to ${temperature}°C`);
  callback(null, { status: `Temperature adjusted successfully to ${temperature}°C` });

};

const getRoomTemperatures = (call) => {
  // Simulated room temperatures with room IDs
  const roomTemperatures = [
    { roomId: 'Dining Room', temperature: 22.5 },
    { roomId: 'Bedroom 1', temperature: 20.3 },
    { roomId: 'Bedroom 2', temperature: 22.8 },
    { roomId: 'Bedroom 3', temperature: 23.6 },
    { roomId: 'Kitchen', temperature: 23.8 },
    { roomId: 'Sitting Room', temperature: 23.7}
  ];

  roomTemperatures.forEach(roomTemperature => {
    const message = { roomId: roomTemperature.roomId, temperature: roomTemperature.temperature };
    call.write(message); // Send each room temperature to the client
  });

  call.end(); // Close the stream
};

// Implement the gRPC service methods for smart lighting
const setLighting = (call, callback) => {
  let brightness = 0;
  let lightingProfile = ''; // Store lighting profile ID

  call.on('data', (profile) => {
    console.log(`Adjusting lighting profile ${profile.profileId} with brightness ${profile.brightness}`);
    brightness = profile.brightness;
    lightingProfile = profile.profileId; // Update lighting profile ID
  });

  call.on('error', (error) => {
    console.error('Error:', error.message);
    callback(error); // Send error to client
  });

  call.on('end', () => {
    console.log('Client stream ended');
    // Send response to client including lighting profile
    callback(null, { status: brightness, profileId: lightingProfile });
  });
};


// Make a new gRPC server
const server = new grpc.Server();

// Add the service and implementations to the server
server.addService(smart_heating.HeatingService.service, { adjustTemperature, getRoomTemperatures });
server.addService(smart_lighting.LightingService.service, { setLighting });

//callback function for the bindAsync method to start the server after binding
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});
