// EXAMPLE STALL SEED: adds 19 stalls (with dishes) to EVERY hawker centre that sells food,
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

// ── 19 stall types: every centre gets one of each ──
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
  },
  {
    names: ['Spice Route Laksa', 'Coconut Grove Laksa', 'Old Town Laksa'],
    restDays: ['Tuesday'],
    dishes: [
      { name: 'Laksa', price: 5.0, tags: [] },
      { name: 'Lor mee', price: 4.5, tags: [] }
    ]
  },
  {
    names: ['Minced Meat Noodle House', 'Springy Bowl Bak Chor Mee', 'Neighbourhood Bak Chor Mee'],
    dishes: [
      { name: 'Bak chor mee', price: 5.0, tags: [] },
      { name: 'Fishball noodles', price: 4.5, tags: [] }
    ]
  },
  {
    names: ['Pandan Leaf Nasi Lemak', 'Sambal House Nasi Lemak', 'Kampung Nasi Lemak'],
    dishes: [
      { name: 'Nasi lemak with chicken wing', price: 5.0, tags: ['halal'] },
      { name: 'Nasi lemak with fried fish', price: 5.5, tags: ['halal'] }
    ]
  },
  {
    names: ['Bara Api Satay', 'Smoky Stick Satay', 'Charcoal Corner Satay'],
    restDays: ['Monday'],
    dishes: [
      { name: 'Chicken satay (10 sticks)', price: 7.0, tags: ['halal'] },
      { name: 'Mutton satay (10 sticks)', price: 8.0, tags: ['halal'] }
    ]
  },
  {
    names: ['Saffron Indian Muslim Food', 'Rasa Mamak Corner', 'Barakah Indian Muslim Food'],
    dishes: [
      { name: 'Mee goreng', price: 5.0, tags: ['halal'] },
      { name: 'Chicken briyani', price: 6.5, tags: ['halal'] }
    ]
  },
  {
    names: ['Banana Leaf Vegetarian', 'Chennai Veg Corner', 'Ghee Leaf Vegetarian'],
    dishes: [
      { name: 'Masala thosai', price: 3.5, tags: ['vegetarian'] },
      { name: 'Vegetarian briyani', price: 5.0, tags: ['vegetarian'] }
    ]
  },
  {
    names: ['Green Tea Thunder Rice', 'Hakka Herb Thunder Tea Rice', 'Garden Bowl Thunder Tea Rice'],
    dishes: [
      { name: 'Thunder tea rice', price: 5.5, tags: ['vegetarian'] }
    ]
  },
  {
    names: ['Prawn Stock Hokkien Mee', 'Wok Master Hokkien Mee', 'Seaside Hokkien Mee'],
    restDays: ['Thursday'],
    dishes: [
      { name: 'Fried Hokkien prawn mee', price: 5.0, tags: [] }
    ]
  },
  {
    names: ['Golden Fried Carrot Cake', 'Crispy Bits Carrot Cake', 'Morning Market Carrot Cake'],
    dishes: [
      { name: 'Fried carrot cake (white)', price: 4.0, tags: [] },
      { name: 'Fried carrot cake (black)', price: 4.0, tags: [] }
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

    // ── 2. Get every centre that actually sells food (skip market-only ones) ──
    //    $gt: 0 means "greater than 0"
    const centres = await mongoose.connection.collection('centres')
      .find({ foodStalls: { $gt: 0 } }).toArray()

    if (centres.length === 0) {
      throw new Error('No centres found. Run seed.js first.')
    }

    // ── 3. Build every stall and dish in memory first (no database trips yet) ──
    const stalls = []
    const dishes = []

    for (let c = 0; c < centres.length; c++) {
      const centreId = String(centres[c].serialNo)        // stalls store centre_id as text

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

    // ── 4. Save everything in TWO trips (instead of thousands) ──
    await Stall.insertMany(stalls)
    await Dish.insertMany(dishes)
    console.log(`Created ${stalls.length} stalls and ${dishes.length} dishes at ${centres.length} centres`)

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (err) {
    console.error('Pilot stall seed failed:', err)
    await mongoose.disconnect()
    process.exit(1)
  }
}

seedPilotStalls()