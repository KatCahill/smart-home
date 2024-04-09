var readlineSync = require("readline-sync")
var grpc = require("@grpc-js")
var protoLoader = require("@grpc/proto-loader")

var PROTO_PATH = __dirname + "/protos/calc.proto"
var packageDefinition = protoLoader.loadSync(PROTO_PATH)

var calc_proto = grpc.loadPackageDefintion(packageDefinition).calc_proto

var client = new calc_proto.CalcService("0.0.0.0:4000", grpc.Credentials.createInsecure());
var number1 = readlineSync.question("What is number1?")
var number2 = readlineSync.question("What is number2?")

try{
  client.add({
    number1: number1,
    number2: number2}, function(error,response){
      try{
        if(response.message){
          console.log(response.message)
        }else{
          console.log(response.result)
        }
      }catch(e){
        console.log("server issue")
      }
    })
}catch(e){
  console.log("Error Occured")
}
