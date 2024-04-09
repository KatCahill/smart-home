//loading service definition
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")

var PROTO_PATH = __dirname + "/protos/calc.proto"
//Load proto file
var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var calc_proto = grpc.loadPackageDefinition(packageDefinition).calc

//service implementation where the logic resides
function add(call, callback) {
  try {
    var number1 = parseInt(call.request.number1)
    var number2 = parseInt(call.request.number2)
    console.log("I AM HERE", number1)
    if (!isNan(number1) && !isNan(number2)) {
      var result = number1 + number2;
      console.log("Result", result)
      callback(null, {
        message: "success",
        result: result
      })
    } else {
      callback(null, {
        message: "please specify two numbers"
      })
    }
  } catch(e) {
    callback(null, {
      message: "Error Occurred"
    })}
}

//make new server
var server = new grpc.Server()
server.addService(calc_proto.CalcService.service, { add: add })
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(),
  function (){
  server.start()
})
