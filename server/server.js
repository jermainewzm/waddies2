const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const mongoose = require("mongoose")


const server = express()
server.use(express.json())
server.use(cors())
dotenv.config({path: "./.env"})

const planRoutes = require("./routes/plans-routes")
const errorHandler = require("./middleware/errors-middleware")

server.use("/api/plans", planRoutes )

//error handling
server.use(errorHandler)

async function connectDB() {
  try {
    await mongoose.connect(process.env.DB)
    console.log("Using database:", mongoose.connection.name)
    console.log("MongoDB connected")
  } catch (error) {
    console.error("MongoDB connection failed:", error.message)
    process.exit(1)
  }
}

const PORT = process.env.PORT || 8000
connectDB().then(() => {
  server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
})