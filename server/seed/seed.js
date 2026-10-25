// Seeds the database for a demo:
//   1. All hawker centres, imported from NEA (real data)
//   2. Demo users          <- added later
//   3. Pilot centre stalls <- added later
// Run from the server folder:  node seed/seed.js
const path = require('path')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const { fetchAllCentres, formatCentre } = require('../utils/centres-helper')
const centreModel = require('../models/centre-model')
const Admin = require("../models/admin-model")


async function seed() {
    try {
        await mongoose.connect(process.env.DB)
        console.log('Connected to MongoDB')

        // 1. clear existing data first
        await mongoose.connection.collection('centres').deleteMany({})
        console.log('Cleared existing data')

        //2. then we import the centres from NEA
        const records = await fetchAllCentres()
        
        for (const record of records) {
            await centreModel.addCentre(formatCentre(record))
        }
         console.log(`Imported ${records.length} centres from NEA`)
         
         // ── 3. Seed demo admins
        await Admin.deleteMany({})

        await Admin.insertMany([
            {
                admin_id: "admin_001",
                name: "Admin 1"
            },
            {
                admin_id: "admin_002",
                name: "Admin 2"
            }
        ])

        console.log("Created demo admins")

         // ── 4. Stalls for pilot centres: added later ──
         console.log('\n✅ Seed complete!')
         await mongoose.disconnect()
         console.log("Disconnected from MongoDB")

    } catch(err) {
        console.error("Seed failed:", err)
        await mongoose.disconnect()
        process.exit(1)
    }
       
}

seed()