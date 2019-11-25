"use strict"

const express = require("express")
const fs = require("fs")
const bodyParser = require("body-parser")
const textLogger = require("./utils").textLogger
const { createRouter } = require("./routes/lambda")
const app = express()

const logFile = "log/notification.log"


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set("view engine", "ejs")

app.use(express.static("public"))

app.get("/", (req, res) => {
  res.redirect("/lambda")
})

app.use("/lambda", createRouter("lambda"))

app.get("/log", (req, res) => {
  fs.readFile(logFile, (err, data) => {
    // no way to log error
    res.render(`log`, { "log": data })
  })
})

app.delete("/log", (req, res) => {
  fs.writeFile(logFile, "", (err, data) => {
    if (err) {
      console.log("encounter error", err)
      res.status(500).send("error")
    } else
      res.send("complete")
  })
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
  console.log(JSON.stringify(req.body))
  try {
    fs.statSync(logFile);
    console.log('it exists');
    fs.appendFileSync(logFile, "\n")
    fs.appendFileSync(logFile, JSON.stringify(req.body))
  }
  catch (err) {
    console.log('it does not exist');
    fs.writeFileSync(logFile, JSON.stringify(req.body))
  }

  res.status(200).json({
    "message": "ok, received"
  })
})

let port = 80
app.listen(port, () => console.log(`App is listening on port ${port}!`))