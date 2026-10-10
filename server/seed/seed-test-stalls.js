// TEST DATA ONLY: adds a few stalls + dishes to 4 real town centres,
// so we can test the shortlist logic. Does NOT touch the centres.
// Run AFTER seed.js (the centres must exist):  node seed/seed-test-stalls.js

const path = require('path')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const Stall = require('../models/stall-model')
const Dish = require('../models/dish-model')

// Find a centre by its exact NEA name, and return its _id as text
// (stalls store centre_id as text, not as an ObjectId)
async function centreIdByName(name) {
  const centre = await mongoose.connection.collection('centres').findOne({ name: name })
  if (!centre) {
    throw new Error(`Centre not found: ${name}`)    // stop if a name is misspelt
  }
  return String(centre._id)
}

async function seedTestStalls() {
  try {
    await mongoose.connect(process.env.DB)
    console.log('Connected to MongoDB')

    // ── 1. Clear old stalls and dishes (NOT centres) ──
    await mongoose.connection.collection('stalls').deleteMany({})
    await mongoose.connection.collection('dishes').deleteMany({})
    console.log('Cleared stalls and dishes')

    // ── 2. Find the 4 test centres' real IDs ──
    const maxwell = await centreIdByName('Maxwell Food Centre (Kim Hua Market)')
    const amoy = await centreIdByName('Amoy Street Food Centre (Telok Ayer Food Centre)')
    const hongLim = await centreIdByName('Upper Cross Street Blk 531A (Hong Lim Food Centre and Market)')
    const chinatown = await centreIdByName('Smith Street Blk 335 (Chinatown Complex Market)')
    console.log('Found the 4 test centres')

    // ── 3. Stalls and dishes: added in the next step ──
    const maxwellChicken = await Stall.create({ centre_id: maxwell, owner_id: 'test_owner', name: 'Test Halal Chicken Rice', unit_no: '#01-01', status: 'open' })
    const maxwellVeg = await Stall.create({ centre_id: maxwell, owner_id: 'test_owner', name: 'Test Vegetarian Bee Hoon', unit_no: '#01-02', status: 'open' })
    const amoyCharSiu = await Stall.create({ centre_id: amoy, owner_id: 'test_owner', name: 'Test Char Siu Rice', unit_no: '#01-03', status: 'open' })
    const hongLimPadang = await Stall.create({ centre_id: hongLim, owner_id: 'test_owner', name: 'Test Nasi Padang', unit_no: '#01-04', status: 'open' })
    const chinatownVeg = await Stall.create({ centre_id: chinatown, owner_id: 'test_owner', name: 'Test Veggie Rice', unit_no: '#01-05', status: 'closed' })
    const chinatownHalal = await Stall.create({ centre_id: chinatown, owner_id: 'test_owner', name: 'Test Halal Mee Rebus', unit_no: '#01-06', status: 'open' })
    console.log('Created 6 test stalls')

    // ── 4. Dishes (each linked to a stall by its _id) ──
    await Dish.create({ stall_id: maxwellChicken._id, name: 'Chicken rice', price: 5, tags: ['halal'] })        // Maxwell: halal OK
    await Dish.create({ stall_id: maxwellVeg._id, name: 'Vegetarian bee hoon', price: 4, tags: ['vegetarian'] }) // Maxwell: veg OK
    await Dish.create({ stall_id: amoyCharSiu._id, name: 'Char siu rice', price: 5, tags: [] })                 // Amoy: no halal, no veg
    await Dish.create({ stall_id: hongLimPadang._id, name: 'Nasi padang', price: 9, tags: ['halal'] })          // Hong Lim: halal but $9
    await Dish.create({ stall_id: chinatownVeg._id, name: 'Vegetarian rice', price: 4, tags: ['vegetarian'] })  // Chinatown: stall is CLOSED
    await Dish.create({ stall_id: chinatownHalal._id, name: 'Mee rebus', price: 4, tags: ['halal'], is_available: false }) // Chinatown: SOLD OUT
    console.log('Created 6 test dishes')

    
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (err) {
    console.error('Test seed failed:', err)
    await mongoose.disconnect()
    process.exit(1)
  }
}

seedTestStalls()