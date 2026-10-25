// EXAMPLE STALL SEED: adds example stalls (with dishes) to every hawker centre that sells food,
// so the shortlist and Centre Search have data wherever a group is.
//
// The CENTRES are real (from NEA's dataset). The STALLS are fictional examples:
// real stall names, menus, prices and halal status aren't publicly available.
// Real hawkers add their own stalls through the Hawker Dashboard.
//
// Stalls link to centres by the centre's serialNo (NEA's ID, e.g. "72" for Maxwell).
//
// WARNING: deletes ALL stalls and dishes first. Only run on your OWN database.
// Run AFTER seed.js (the centres must exist):  node seed/seed-test-stalls.js

const path = require('path')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const Stall = require('../models/stall-model')
const Dish = require('../models/dish-model')

// ── Name prefixes (all fictional), combined with each stall's food type ──
// e.g. "Evergreen" + "Chicken Rice" -> "Evergreen Chicken Rice"
const GENERAL_PREFIXES = [
  'Sunrise', 'Golden', 'Evergreen', 'Lucky Star', 'Harbour', 'Old Street',
  'Riverside', 'Hilltop', 'Lantern', 'Jade', 'Bamboo', 'Orchid',
  'Pearl', 'Banyan', 'Coral', 'Morning', 'Corner', 'Happy',
  'Lotus', 'Twin Dragon', 'Silver Spoon', 'Kampong', 'Garden', 'Uncle Lee'
]
const MALAY_PREFIXES = [
  'Seri', 'Warung Selera', 'Rumah Rasa', 'Sedap', 'Mak Cik', 'Nur',
  'Bismillah', 'Al-Amin', 'Barakah', 'Kampung', 'Pak Long', 'Selamat'
]
const INDIAN_PREFIXES = [
  'Saffron', 'Chennai', 'Banana Leaf', 'Rasa', 'Mamak Express', 'Ghee Leaf',
  'Spice Route', 'Madras', 'Curry Leaf', 'Taj', 'Annapoorna', 'Kerala'
]

// ── Stall types ──
// A small centre only gets the FIRST few types, so the first six cover every diet:
// any, halal, vegetarian, no_pork and no_beef.
// tags must match the Dish model: halal, vegetarian, no_pork, no_beef
const STALL_TYPES = [
  {
    label: 'Chicken Rice', prefixes: GENERAL_PREFIXES,
    dishes: [
      { name: 'Steamed chicken rice', price: 4.5, tags: [] },
      { name: 'Roasted chicken rice', price: 5.0, tags: [] }
    ]
  },
  {
    label: 'Halal Chicken Rice', prefixes: MALAY_PREFIXES,
    dishes: [
      { name: 'Halal chicken rice', price: 5.0, tags: ['halal'] },
      { name: 'Chicken drumstick rice', price: 6.0, tags: ['halal'] }
    ]
  },
  {
    label: 'Nasi Padang', prefixes: MALAY_PREFIXES,
    dishes: [
      { name: 'Nasi padang with chicken', price: 6.0, tags: ['halal'] },
      { name: 'Mee rebus', price: 4.0, tags: ['halal'] }
    ]
  },
  {
    label: 'Prata', prefixes: INDIAN_PREFIXES,
    dishes: [
      { name: 'Roti prata (2 pieces)', price: 2.8, tags: ['halal'] },
      { name: 'Chicken murtabak', price: 6.5, tags: ['halal'] }
    ]
  },
  {
    label: 'Vegetarian', prefixes: GENERAL_PREFIXES,
    dishes: [
      { name: 'Vegetarian bee hoon', price: 3.5, tags: ['vegetarian'] },
      { name: 'Vegetarian mixed rice', price: 4.5, tags: ['vegetarian'] }
    ]
  },
  {
    label: 'Fish Soup', prefixes: GENERAL_PREFIXES, restDays: ['Monday'],
    dishes: [
      { name: 'Sliced fish soup', price: 6.0, tags: ['no_pork', 'no_beef'] },
      { name: 'Fish bee hoon soup', price: 6.5, tags: ['no_pork', 'no_beef'] }
    ]
  },
  {
    label: 'Western Food', prefixes: GENERAL_PREFIXES,
    dishes: [
      { name: 'Chicken chop', price: 7.0, tags: ['no_pork', 'no_beef'] },
      { name: 'Fish and chips', price: 7.5, tags: ['no_pork', 'no_beef'] }
    ]
  },
  {
    label: 'Char Kway Teow', prefixes: GENERAL_PREFIXES, restDays: ['Wednesday'],
    dishes: [
      { name: 'Char kway teow', price: 5.0, tags: [] }
    ]
  },
  {
    label: 'Economic Rice', prefixes: GENERAL_PREFIXES,
    dishes: [
      { name: '2 veg 1 meat rice', price: 4.0, tags: [] },
      { name: '3 veg rice', price: 3.5, tags: [] }
    ]
  },
  {
    label: 'Wanton Mee', prefixes: GENERAL_PREFIXES,
    dishes: [
      { name: 'Wanton mee', price: 5.0, tags: [] },
      { name: 'Dumpling noodle soup', price: 5.5, tags: [] }
    ]
  },
  {
    label: 'Laksa', prefixes: GENERAL_PREFIXES, restDays: ['Tuesday'],
    dishes: [
      { name: 'Laksa', price: 5.0, tags: [] },
      { name: 'Lor mee', price: 4.5, tags: [] }
    ]
  },
  {
    label: 'Bak Chor Mee', prefixes: GENERAL_PREFIXES,
    dishes: [
      { name: 'Bak chor mee', price: 5.0, tags: [] },
      { name: 'Fishball noodles', price: 4.5, tags: [] }
    ]
  },
  {
    label: 'Nasi Lemak', prefixes: MALAY_PREFIXES,
    dishes: [
      { name: 'Nasi lemak with chicken wing', price: 5.0, tags: ['halal'] },
      { name: 'Nasi lemak with fried fish', price: 5.5, tags: ['halal'] }
    ]
  },
  {
    label: 'Satay', prefixes: MALAY_PREFIXES, restDays: ['Monday'],
    dishes: [
      { name: 'Chicken satay (10 sticks)', price: 7.0, tags: ['halal'] },
      { name: 'Mutton satay (10 sticks)', price: 8.0, tags: ['halal'] }
    ]
  },
  {
    label: 'Indian Muslim Food', prefixes: INDIAN_PREFIXES,
    dishes: [
      { name: 'Mee goreng', price: 5.0, tags: ['halal'] },
      { name: 'Chicken briyani', price: 6.5, tags: ['halal'] }
    ]
  },
  {
    label: 'Indian Vegetarian', prefixes: INDIAN_PREFIXES,
    dishes: [
      { name: 'Masala thosai', price: 3.5, tags: ['vegetarian'] },
      { name: 'Vegetarian briyani', price: 5.0, tags: ['vegetarian'] }
    ]
  },
  {
    label: 'Thunder Tea Rice', prefixes: GENERAL_PREFIXES,
    dishes: [
      { name: 'Thunder tea rice', price: 5.5, tags: ['vegetarian'] }
    ]
  },
  {
    label: 'Hokkien Mee', prefixes: GENERAL_PREFIXES, restDays: ['Thursday'],
    dishes: [
      { name: 'Fried Hokkien prawn mee', price: 5.0, tags: [] }
    ]
  },
  {
    label: 'Carrot Cake', prefixes: GENERAL_PREFIXES,
    dishes: [
      { name: 'Fried carrot cake (white)', price: 4.0, tags: [] },
      { name: 'Fried carrot cake (black)', price: 4.0, tags: [] }
    ]
  }
]

async function seedExampleStalls() {
  try {
    await mongoose.connect(process.env.DB)
    console.log('Connected to MongoDB')

    // ── 1. Clear old stalls and dishes (NOT centres) ──
    await mongoose.connection.collection('stalls').deleteMany({})
    await mongoose.connection.collection('dishes').deleteMany({})
    console.log('Cleared stalls and dishes')

    // ── 2. Every centre that actually sells food (skip market-only ones) ──
    const centres = await mongoose.connection.collection('centres')
      .find({ foodStalls: { $gt: 0 } }).toArray()

    if (centres.length === 0) {
      throw new Error('No centres found. Run seed.js first.')
    }

    // ── 3. Build every stall and dish in memory first (no database trips yet) ──
    const stalls = []
    const dishes = []

    let ownerCounter = 1 

    for (let c = 0; c < centres.length; c++) {
      const centre = centres[c]
      const serialNo = String(centre.serialNo)          // link by NEA's ID, e.g. "72"

      // Never more stalls than the centre really has (e.g. Kebun Baru has only 10)
      const stallsHere = Math.min(STALL_TYPES.length, centre.foodStalls)

      // Prices vary a little between centres: +$0.00 to +$1.20, in 30-cent steps
      const priceOffset = (c % 5) * 0.3

      for (let s = 0; s < stallsHere; s++) {
        const type = STALL_TYPES[s]

        // A different prefix at different centres, e.g. "Evergreen Chicken Rice"
        const prefix = type.prefixes[(c * 7 + s * 3) % type.prefixes.length]

        // A different unit number at each centre, between #01-10 and #01-69
        const unitNo = `#01-${String(10 + ((s * 7 + c * 3) % 60)).padStart(2, '0')}`

        // Make the stall's _id NOW, so its dishes can point to it before anything is saved
        const stallId = new mongoose.Types.ObjectId()

        stalls.push({
          _id: stallId,
          serialNo: serialNo,
          owner_id: `HAWKER_${String(ownerCounter++).padStart(3, '0')}`,
          name: `${prefix} ${type.label}`,
          unit_no: unitNo,
          status: 'open',
          rest_days: type.restDays || []
        })

        for (const dish of type.dishes) {
          dishes.push({
            stall_id: stallId,
            name: dish.name,
            price: Math.round((dish.price + priceOffset) * 10) / 10,   // keep to 1 decimal, e.g. 5.3
            tags: dish.tags
          })
        }
      }
    }

    // ── 4. Save everything in TWO trips ──
    await Stall.insertMany(stalls)
    await Dish.insertMany(dishes)
    console.log(`Created ${stalls.length} stalls and ${dishes.length} dishes at ${centres.length} centres`)

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (err) {
    console.error('Example stall seed failed:', err)
    await mongoose.disconnect()
    process.exit(1)
  }
}

seedExampleStalls()