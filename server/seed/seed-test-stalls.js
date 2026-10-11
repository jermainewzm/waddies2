// PILOT STALL SEED: adds 10 generic stalls (with dishes) to 15 real hawker centres
// spread across Singapore, so the shortlist can find matches wherever a group is.
//
// The CENTRES are real (exact names from NEA's dataset).
// The STALLS are generic examples, NOT real businesses: real stall names, menus,
// prices and halal status aren't publicly available, and must not be guessed.
// Real hawkers add their own stalls through the Hawker Dashboard.
//
// WARNING: deletes ALL stalls and dishes first. Only run on your OWN database.
// Run AFTER seed.js (the centres must exist):  node seed/seed-test-stalls.js

const path = require('path')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const Stall = require('../models/stall-model')
const Dish = require('../models/dish-model')

// ── 15 pilot centres: exact NEA names, spread across Singapore ──
const PILOT_CENTRES = [
  // North
  'Kampung Admiralty Hawker Centre',
  'Marsiling Mall Hawker Centre',
  'Yishun Ring Road Blk 104/105 (Chong Pang Market and Food Centre)',
  // North-east
  'Ang Mo Kio Ave 4 Blk 160/162 (Mayflower Market)',
  'Hougang Street 21 Blk 209 (Kovan Hougang Market and Food Centre)',
  'One Punggol Hawker Centre',
  // East
  'New Upper Changi Road Blk 208B (Bedok Interchange Hawker Centre)',
  'The Hawker Centre @ Our Tampines Hub',
  'Pasir Ris Central Hawker Centre',
  'Old Airport Road Blk 51 (51 Old Airport Road Food Centre and Shopping Mall)',
  // West
  'Taman Jurong Market and Food Centre',
  'Jurong West Hawker Centre',
  'Clementi Ave 3 Blk 448',
  // Central
  'Maxwell Food Centre (Kim Hua Market)',
  'Smith Street Blk 335 (Chinatown Complex Market)'
]

// ── 10 stall types: every pilot centre gets one of each ──
// Each type has 3 fictional names, rotated across centres so neighbouring centres look different.
// The names are made up for this demo (any resemblance to a real stall is coincidental).
// tags must match the Dish model: halal, vegetarian, no_pork, no_beef
const STALL_TYPES = [
  {
    names: ['Sunrise Chicken Rice', 'Golden Hen Chicken Rice', 'Kampong Corner Chicken Rice'],
    dishes: [
      { name: 'Steamed chicken rice', price: 4.5, tags: [] },
      { name: 'Roasted chicken rice', price: 5.0, tags: [] }
    ]
  },
  {
    names: ['Bismillah Chicken Rice', 'Nur Halal Chicken Rice', 'Al-Amin Chicken Rice'],
    dishes: [
      { name: 'Halal chicken rice', price: 5.0, tags: ['halal'] },
      { name: 'Chicken drumstick rice', price: 6.0, tags: ['halal'] }
    ]
  },
  {
    names: ['Warung Selera Nasi Padang', 'Rumah Rasa Nasi Padang', 'Sedap Corner Nasi Padang'],
    dishes: [
      { name: 'Nasi padang with chicken', price: 6.0, tags: ['halal'] },
      { name: 'Mee rebus', price: 4.0, tags: ['halal'] }
    ]
  },
  {
    names: ['Prata Paradise', 'Crispy Corner Prata', 'Mamak Express Prata'],
    dishes: [
      { name: 'Roti prata (2 pieces)', price: 2.8, tags: ['halal'] },
      { name: 'Chicken murtabak', price: 6.5, tags: ['halal'] }
    ]
  },
  {
    names: ['Green Leaf Vegetarian', 'Lotus Garden Vegetarian', 'Pure Harvest Vegetarian'],
    dishes: [
      { name: 'Vegetarian bee hoon', price: 3.5, tags: ['vegetarian'] },
      { name: 'Vegetarian mixed rice', price: 4.5, tags: ['vegetarian'] }
    ]
  },
  {
    names: ['Ocean Bowl Fish Soup', 'Sea Breeze Fish Soup', 'Clear Water Fish Soup'],
    restDays: ['Monday'],
    dishes: [
      { name: 'Sliced fish soup', price: 6.0, tags: ['no_pork', 'no_beef'] },
      { name: 'Fish bee hoon soup', price: 6.5, tags: ['no_pork', 'no_beef'] }
    ]
  },
  {
    names: ['Grill Street Western', 'Uncle Bob Western Food', 'Hearty Plate Western'],
    dishes: [
      { name: 'Chicken chop', price: 7.0, tags: ['no_pork', 'no_beef'] },
      { name: 'Fish and chips', price: 7.5, tags: ['no_pork', 'no_beef'] }
    ]
  },
  {
    names: ['Wok Hei Char Kway Teow', 'Fire Wok Fried Kway Teow', 'Smoky Wok Char Kway Teow'],
    restDays: ['Wednesday'],
    dishes: [
      { name: 'Char kway teow', price: 5.0, tags: [] }
    ]
  },
  {
    names: ['Happy Plate Economic Rice', 'Family Mixed Rice', 'Rice Bowl Economic Rice'],
    dishes: [
      { name: '2 veg 1 meat rice', price: 4.0, tags: [] },
      { name: '3 veg rice', price: 3.5, tags: [] }
    ]
  },
  {
    names: ['Noodle Lane Wanton Mee', 'Springy Noodle Wanton Mee', 'Dumpling House Wanton Mee'],
    dishes: [
      { name: 'Wanton mee', price: 5.0, tags: [] },
      { name: 'Dumpling noodle soup', price: 5.5, tags: [] }
    ]
  }
]

// Find a centre by its exact NEA name, and return its _id as text
// (stalls store centre_id as text, not as an ObjectId)
async function centreIdByName(name) {
  const centre = await mongoose.connection.collection('centres').findOne({ name: name })
  if (!centre) {
    throw new Error(`Centre not found: ${name}`)
  }
  return String(centre._id)
}

async function seedPilotStalls() {
  try {
    await mongoose.connect(process.env.DB)
    console.log('Connected to MongoDB')

    // ── 1. Clear old stalls and dishes (NOT centres) ──
    await mongoose.connection.collection('stalls').deleteMany({})
    await mongoose.connection.collection('dishes').deleteMany({})
    console.log('Cleared stalls and dishes')

    let stallCount = 0
    let dishCount = 0

    // ── 2. For each pilot centre, add one stall of each type, with its dishes ──
    for (let c = 0; c < PILOT_CENTRES.length; c++) {
      const centreId = await centreIdByName(PILOT_CENTRES[c])

      // Small price difference between centres (+$0, +$0.50 or +$1),
      // so not every centre has identical prices
      const priceOffset = (c % 3) * 0.5

      for (let s = 0; s < STALL_TYPES.length; s++) {
        const type = STALL_TYPES[s]

        const stall = await Stall.create({
          centre_id: centreId,
          owner_id: 'seed_owner',
          name: type.names[c % type.names.length],   // pick 1 of the 3 names, depending on the centre
          unit_no: `#01-${String(10 + s).padStart(2, '0')}`,
          status: 'open',
          rest_days: type.restDays || []
        })
        stallCount++

        for (const dish of type.dishes) {
          await Dish.create({
            stall_id: stall._id,
            name: dish.name,
            price: dish.price + priceOffset,
            tags: dish.tags
          })
          dishCount++
        }
      }
      console.log(`Seeded ${PILOT_CENTRES[c]}`)
    }

    console.log(`\nCreated ${stallCount} stalls and ${dishCount} dishes at ${PILOT_CENTRES.length} centres`)

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (err) {
    console.error('Pilot stall seed failed:', err)
    await mongoose.disconnect()
    process.exit(1)
  }
}

seedPilotStalls()