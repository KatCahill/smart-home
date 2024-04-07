const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + "/protos/smart_heating.proto";

// Load the Protocol Buffer file
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const { HeatingService } = protoDescriptor;

// Implement the gRPC service methods
const adjustTemperature = (call, callback) => {
  const temperature = call.request.temperature;
  // Your logic to adjust the temperature goes here
  const status = `Temperature adjusted to ${temperature}°C`;
  callback(null, { status });
};

const getRoomTemperatures = (call) => {
  // Simulated room temperatures with room IDs
  const roomTemperatures = [
    { roomId: 'Living Room', temperature: 22.5 },
    { roomId: 'Bedroom', temperature: 20.3 },
    { roomId: 'Kitchen', temperature: 23.8 }
  ];

  roomTemperatures.forEach(roomTemperature => {
    const message = { roomId: roomTemperature.roomId, temperature: roomTemperature.temperature };
    call.write(message); // Send each room temperature to the client
  });

  call.end(); // Close the stream
};


// Create a gRPC server
const server = new grpc.Server();

// Add the service and its implementations to the server
server.addService(HeatingService.service, { adjustTemperature, getRoomTemperatures });

// Bind the server to the specified port and start it
const port = "0.0.0.0:40000";
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(`Failed to bind server to port ${port}: ${err}`);
    return;
  }
  console.log(`Server running at ${port}`);
  // Start the server
  server.start();
});
