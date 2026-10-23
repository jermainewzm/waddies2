const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const mongoose = require("mongoose")

const server = express()

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

const errorHandler = require("./middleware/errors-middleware")

// On Vercel the server starts fresh for a request, so we connect once and
// reuse that connection while the instance stays warm
let dbConnection = null

function connectDB() {
  if (!dbConnection) {
    dbConnection = mongoose.connect(process.env.DB)
  }
  return dbConnection
}

// every route needs the database, so wait for it before handling anything
server.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (error) {
    console.error("MongoDB connection failed:", error.message)
    next(error)
  }
})

server.use("/api/plans", planRoutes)
server.use("/api/centres", centreRoutes)
server.use("/api/centre-search", centreSearchRoutes)
server.use("/api/hawker", hawkerRoutes)
server.use("/api/hawker", stallRoutes)
server.use("/api/hawker", dishRoutes)
server.use("/api/hawker", shoutoutRoutes)

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