"use strict"

const express = require("express")
const fs = require("fs-extra")
const bodyParser = require("body-parser")
const textLogger = require("./utils").textLogger
const { createRouter } = require("./routes/lambda")
const app = express()

const logFile = "notification.log"
const deviceLogDirectory = "log/deviceLog/"
const messageLogDirectory = "log/messageLog/"
const messageLogFile = messageLogDirectory + logFile


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set("view engine", "ejs")

app.use(express.static("public"))

app.get("/", (req, res) => {
  res.redirect("/lambda")
})

app.use("/lambda", createRouter("lambda"))

// View message Log
app.get("/log", (req, res) => {
  fs.readFile(messageLogFile, (err, data) => {
    // no way to log error
    res.render(`log`, { "log": data })
  })
})

// View device Log
app.get("/log/:deviceId", (req, res) => {
  fs.readFile(deviceLogDirectory + req.params.deviceId + "/" + logFile, (err, data) => {
    // no way to log error
    res.render(`log`, { "log": data })
  })
})

app.delete("/log", (req, res) => {
  try{
    fs.removeSync(deviceLogDirectory);
    fs.removeSync(messageLogDirectory);
    res.send("complete")
  }
  catch (err) {
    console.log("encounter error", err)
    res.status(500).send("error")
  }
})

app.get("/healthcheck", (req, res) => {
  res.status(200).json({
    "message": "Im healthy!"
  })
})

app.get("/*", (req, res) => {
  textLogger(req.path)("route not found")
  res.status(404).json({
    "message": "not found."
  })
})

// notification receiver
app.post('/receive', (req, res) => {
  console.log("receive")
  const reqBody = JSON.stringify(req.body)
  console.log(reqBody)
  var json = JSON.parse(reqBody)
  // Storing device notification 
  if(json.event.type=='device'){
    var deviceLogFile = deviceLogDirectory + json.event.deviceId + "/" + logFile;
    try{
      fs.statSync(deviceLogFile);
      console.log(json.event.deviceId + ' log exists');
      fs.appendFileSync(deviceLogFile, "\n")
      fs.appendFileSync(deviceLogFile, JSON.stringify(req.body))
    }
    catch (err) {
      console.log(json.event.deviceId + ' log does not exist');
      fs.mkdirsSync(deviceLogDirectory + json.event.deviceId);
      fs.writeFileSync(deviceLogFile, JSON.stringify(req.body))
    }    
  }
  // Storing message notification
  else{
    try {
      fs.statSync(messageLogFile);
      console.log('the adhoc message log exists');
      fs.appendFileSync(messageLogFile, "\n")
      fs.appendFileSync(messageLogFile, JSON.stringify(req.body))
    }
    catch (err) {
      console.log('the adhoc message log it does not exist');
      fs.mkdirsSync(messageLogDirectory);
      fs.writeFileSync(messageLogFile, JSON.stringify(req.body))
    }  
  }
  res.status(200).json({
    "message": "ok, received"
  })
})

function addLogData (logFile, body){
  fs.appendFileSync(logFile, )
}

let port = 80
app.listen(port, () => console.log(`App is listening on port ${port}!`))
