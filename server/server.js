const express = require("express")
const cors = require("cors")
require("dotenv").config()

const server = express()
server.use(express.json())
server.use(cors())


server.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: "Internal server error" })
})

const PORT = process.env.PORT || 8000
server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))