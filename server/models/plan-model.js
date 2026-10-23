const mongoose = require("mongoose")

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true 
},
  lat: { 
    type: Number, 
    required: true 
},
  lng: {
     type: Number, 
     required: true 
},
  diet: { 
    type: String, 
    enum: ["any", "halal", "vegetarian", "no_pork", "no_beef"],  //enum = list of the ONLY values allowed for that field
    default: "any" 
},
  budget: { 
    type: Number, 
    required: true }
})

//ADDED for Dish Search: one centre on the plan's shortlist
//CHANGED (Centre Search): saves the centre's NEA serialNo (e.g. "72") instead of its Mongo _id,
//so the plan, stalls, crowd reports and the centre page all use the SAME id for a centre
const shortlistSchema = new mongoose.Schema({
  serialNo: {
    type: String,
    required: true
  },
  added_by: {
    type: String,
    default: ""
  },
  added_by_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
})
const planSchema = new mongoose.Schema({
    code: { 
      type: String, 
      required: true, 
      unique: true 
    },
    name: {
      type: String, 
      required: true 
    },
    date: { 
      type: String, 
      required: true 
    },  
    time: { 
      type: String, 
      required: true 
    },   
    members: [memberSchema],

    status: {
      type: String,
      enum: ["joining", "swiping", "done"],
      default: "joining"
    },
    shortlist: [shortlistSchema], //ADDED for Dish Search

    swipes : [
      {memberId: {type: mongoose.Schema.Types.ObjectId, required: true},
       centreId: {type: String, required: true}, //CHANGED (Centre Search): the centre's serialNo (was a Centre _id)
       liked: {type: Boolean, required: true}
    }
    ],

    winner: {type: String, default: null} //CHANGED (Centre Search): the winning centre's serialNo (was a Centre _id)
    },
    { timestamps: true }
)

const Plan = mongoose.model("Plan", planSchema, "plan")

//CHANGED (Centre Search): no more .populate(). The shortlist now saves serialNos,
//so the controller looks the centres up itself (see getCentresBySerial in plan-controller.js)
exports.findByCode = function (code) {
  return Plan.findOne({ code: code })
}

exports.addPlan = function (code, name, date, time) {
  return Plan.create({ code: code, name: name, date: date, time: time })
}

exports.addMember = function(code, member) {
  return Plan.findOneAndUpdate(
    {code: code},
    {$push: {members:member}},
    {returnDocument: "after" }

  )
}

exports.updatePlanStatus = function(code,status) {
  return Plan.findOneAndUpdate(
    {code: code},
    {$set: {status: status}},
    { returnDocument: "after" })}

//ADDED for Dish Search: adds one centre to the shortlist
exports.addToShortlist = function(code, item) {
  return Plan.findOneAndUpdate(
    {code: code},
    {$push: {shortlist: item}},
    { returnDocument: "after" }
  )
}

// Replace the plan's shortlist with a new list
exports.setShortlist = function (code, newShortList) {
  return Plan.findOneAndUpdate(
    {code: code},
    { $set: {shortlist: newShortList}},
    { returnDocument: "after" }
  )
}

//Save one member's swipes ($each pushes every item of the array)
exports.addSwipes = function(code, newSwipes) {
  return Plan.findOneAndUpdate(
    {code: code},
    {$push: {swipes: {$each: newSwipes}}},
    {returnDocument: "after"}
  )
}

//Everyone has swiped: save the winner and finish plan
exports.finishPlan = function(code, winnerId) {
  return Plan.findOneAndUpdate(
    {code: code},
    {$set: {status: "done", winner: winnerId}},
    {returnDocument: "after"}
  )
}

//REMOVED (Centre Search): findWinnerByCode. winner is a serialNo now, so getRouteToWinner
//uses findByCode and looks the centre up by serialNo