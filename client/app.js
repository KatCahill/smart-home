const readlineSync = require('readline-sync');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + "/protos/smart_heating.proto";

// Load the Protocol Buffer file
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const { HeatingService } = protoDescriptor;
const client = new HeatingService("0.0.0.0:40000", grpc.credentials.createInsecure());

// Function to adjust temperature
function adjustTemperature() {
  const temperature = parseFloat(readlineSync.question('Enter the desired temperature in °C: '));
  const request = { temperature };
  client.AdjustTemperature(request, (error, response) => {
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Status:', response.status);
    }
  });
}

// Function to get room temperatures
function getRoomTemperatures() {
  const call = client.GetRoomTemperatures({});
  call.on('data', function(roomTemperature) {
    console.log(`Room: ${roomTemperature.roomId}, Temperature: ${roomTemperature.temperature}°C`);
  });
  call.on('error', function(error) {
    console.error('Error:', error.message);
  });
  call.on('end', function() {
    console.log('Server stream ended');
  });
}

// Menu for user interaction
function menu() {
  console.log('1. Adjust Temperature');
  console.log('2. Get Room Temperatures');
  console.log('3. Exit');
  const choice = readlineSync.question('Enter your choice: ');
  switch (choice) {
    case '1':
      adjustTemperature();
      break;
    case '2':
      getRoomTemperatures();
      break;
    case '3':
      console.log('Exiting...');
      process.exit(0);
    default:
      console.log('Invalid choice. Please try again.');
      menu();
  }
}

// Start the menu
menu();
