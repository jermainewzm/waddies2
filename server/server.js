const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const mongoose = require("mongoose")

const server = express()
server.get("/test", (req, res) => {
  res.send("server works")
})

server.use(express.json())
server.use(cors())

dotenv.config({
  path: "./.env"
})

const hawkerRoutes = require("./routes/hawker-routes")
const stallRoutes = require("./routes/stall-routes")
const dishRoutes = require("./routes/dish-routes")
const shoutoutRoutes = require("./routes/shoutout-routes")

const planRoutes = require("./routes/plans-routes")
const centreSearchRoutes = require("./routes/centre-search-routes")
const centreRoutes = require("./routes/centres-routes")
const adminRoutes = require("./routes/admin-routes")

const errorHandler = require("./middleware/errors-middleware")

// On Vercel the server starts fresh for a request, so we connect once and
// reuse that connection while the instance stays warm
let dbConnection = null

async function connectDB() {
  if (!dbConnection) {
    // give up after 5s instead of hanging
    dbConnection = mongoose.connect(process.env.DB, { serverSelectionTimeoutMS: 5000 })
  }
  try {
    await dbConnection
  } catch (error) {
    dbConnection = null   //forget the failed attempt so the next request tries again
    throw error
  }
}

// every route needs the database, so wait for it before handling anything
server.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } 
  
  catch (error) {
    console.error(error)
    return res.status(500).json({
        message: "Something went wrong. Please try again."
    })
  }
})

server.use("/api/plans", planRoutes)
server.use("/api/centres", centreRoutes)
server.use("/api/centre-search", centreSearchRoutes)
server.use("/api/hawker", hawkerRoutes)
server.use("/api/hawker", stallRoutes)
server.use("/api/hawker", dishRoutes)
server.use("/api/hawker", shoutoutRoutes)
server.use("/api/admin", adminRoutes)

//error handling
server.use(errorHandler)

// locally we listen on a port; on Vercel the app is exported instead
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 8000

  connectDB().then(() => {
    console.log("Using database:", mongoose.connection.name)
    server.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`)
    })
  })
}

module.exports = server