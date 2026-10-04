const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
require("dotenv").config()

const server = express()
server.use(express.json())
server.use(cors())


server.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: "Internal server error" })
})

async function connectDB() {
  try {
    await mongoose.connect(process.env.DB)
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