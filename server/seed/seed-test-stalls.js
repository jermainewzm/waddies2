// PILOT STALL SEED: adds 10 stalls (with dishes) to 50 real hawker centres across Singapore,
// so the shortlist can find matches wherever a group is.
//
// The CENTRES are real (exact names from NEA's dataset).
// The STALLS are fictional examples: real stall names, menus, prices and halal status
// aren't publicly available, and must not be guessed. Real hawkers add their own
// stalls through the Hawker Dashboard.
//
// WARNING: deletes ALL stalls and dishes first. Only run on your OWN database.
// Run AFTER seed.js (the centres must exist):  node seed/seed-test-stalls.js

const path = require('path')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const Stall = require('../models/stall-model')
const Dish = require('../models/dish-model')

// ── 50 pilot centres: exact NEA names, spread across Singapore ──
// (roughly in proportion to how many centres each area has)
const PILOT_CENTRES = [
  // Central (26)
  'Adam Road Food Centre',
  'Amoy Street Food Centre (Telok Ayer Food Centre)',
  'Beo Crescent Market',
  'Bukit Merah Central Blk 163 (Bukit Merah Central Food Centre)',
  'Bukit Merah View Blk 115 (Blk 115 Bukit Merah View Market and Food Centre)',
  'Circuit Road Blk 80 (80 Circuit Road Market and Food Centre)',
  'Commonwealth Crescent Market',
  'Eunos Crescent Blk 4A',
  'Geylang Serai Market',
  'Haig Road Blk 13/14 (Haig Road Market and Cooked Food Centre)',
  'Holland Drive Blk 44 (Holland Drive Market and Food Centre)',
  'Jalan Bukit Merah Blk 112 (Blk 112 Jalan Bukit Merah Market and Food Centre)',
  'Jalan Kukoh Blk 1 (Kukoh 21 Food Centre)',
  'Market Street Hawker Centre',
  'Maxwell Food Centre (Kim Hua Market)',
  "New Market Road Blk 32 (People's Park Food Centre)",
  'Old Airport Road Blk 51 (51 Old Airport Road Food Centre and Shopping Mall)',
  'Pasir Panjang Food Centre',
  'Redhill Lane Blk 85 (Redhill Food Centre)',
  'Smith Street Blk 335 (Chinatown Complex Market)',
  'Tanjong Pagar Plaza Blk 6 (Blk 6 Tanjong Pagar Plaza Market and Food Centre)',
  'Telok Blangah Drive Blk 79 (Telok Blangah Food Centre)',
  'Toa Payoh Lorong 4 Blk 74 (Toa Payoh Vista Market)',
  'Toa Payoh Lorong 5 Blk 75',
  'Upper Cross Street Blk 531A (Hong Lim Food Centre and Market)',
  'Whampoa Drive Blk 91/92 (Whampoa Drive Makan Place/Whampoa Market)',
  // North-east (8)
  'Anchorvale Village Hawker Centre',
  'Ang Mo Kio Ave 1 Blk 341 (Teck Ghee Court)',
  'Ang Mo Kio Ave 10 Blk 527 (Cheng San Market and Cooked Food Centre)',
  'Ang Mo Kio Ave 4 Blk 160/162 (Mayflower Market)',
  'Ang Mo Kio Street 22 Blk 226H (Kebun Baru Food Centre)',
  'Ci Yuan Hawker Centre',
  'Hougang Street 21 Blk 209 (Kovan Hougang Market and Food Centre)',
  'Sembawang Hills Food Centre (Jalan Leban Food Centre)',
  // East (7)
  'Bedok Food Centre',
  'Bedok North Street 4 Blk 85 (85 Fengshan Centre)',
  'Marine Parade Central Blk 84 (84 Marine Parade Central Market and Food Centre)',
  'New Upper Changi Road Blk 208B (Bedok Interchange Hawker Centre)',
  'One Punggol Hawker Centre',
  'Pasir Ris Central Hawker Centre',
  'The Hawker Centre @ Our Tampines Hub',
  // West (6)
  'Boon Lay Place Blk 221A/B (Boon Lay Place Market and Food Village)',
  'Clementi Ave 2 Blk 353 (Clementi Ave 2 Market/Cooked Food Centre)',
  'Clementi Ave 3 Blk 448',
  'Jurong West Hawker Centre',
  'Jurong West Street 52 Blk 505',
  'Taman Jurong Market and Food Centre',
  // North (3)
  'Kampung Admiralty Hawker Centre',
  'Marsiling Mall Hawker Centre',
  'Yishun Ring Road Blk 104/105 (Chong Pang Market and Food Centre)'
]

// ── 10 stall types: every pilot centre gets one of each ──
// Each type has 3 fictional names, rotated across centres so neighbouring centres look different.
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

async function seedPilotStalls() {
  try {
    await mongoose.connect(process.env.DB)
    console.log('Connected to MongoDB')

    // ── 1. Clear old stalls and dishes (NOT centres) ──
    await mongoose.connection.collection('stalls').deleteMany({})
    await mongoose.connection.collection('dishes').deleteMany({})
    console.log('Cleared stalls and dishes')

    // ── 2. Find all 50 pilot centres in ONE search, then make a name -> id lookup ──
    const found = await mongoose.connection.collection('centres')
      .find({ name: { $in: PILOT_CENTRES } }).toArray()

    const idByName = {}
    for (const centre of found) {
      idByName[centre.name] = String(centre._id)     // stalls store centre_id as text
    }

    // ── 3. Build every stall and dish in memory first (no database trips yet) ──
    const stalls = []
    const dishes = []

    for (let c = 0; c < PILOT_CENTRES.length; c++) {
      const centreId = idByName[PILOT_CENTRES[c]]
      if (!centreId) {
        throw new Error(`Centre not found: ${PILOT_CENTRES[c]} (run seed.js first?)`)
      }

      // Small price difference between centres (+$0, +$0.50 or +$1)
      const priceOffset = (c % 3) * 0.5

      for (let s = 0; s < STALL_TYPES.length; s++) {
        const type = STALL_TYPES[s]

        // Make the stall's _id NOW, so its dishes can point to it before anything is saved
        const stallId = new mongoose.Types.ObjectId()

        stalls.push({
          _id: stallId,
          centre_id: centreId,
          owner_id: 'seed_owner',
          name: type.names[c % type.names.length],    // 1 of the 3 names, depending on the centre
          unit_no: `#01-${String(10 + s).padStart(2, '0')}`,
          status: 'open',
          rest_days: type.restDays || []
        })

        for (const dish of type.dishes) {
          dishes.push({
            stall_id: stallId,                        // linked to the stall above
            name: dish.name,
            price: dish.price + priceOffset,
            tags: dish.tags
          })
        }
      }
    }

    // ── 4. Save everything in TWO trips (instead of ~1,500) ──
    await Stall.insertMany(stalls)
    await Dish.insertMany(dishes)
    console.log(`Created ${stalls.length} stalls and ${dishes.length} dishes at ${PILOT_CENTRES.length} centres`)

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (err) {
    console.error('Pilot stall seed failed:', err)
    await mongoose.disconnect()
    process.exit(1)
  }
}

seedPilotStalls()