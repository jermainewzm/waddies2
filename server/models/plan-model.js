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
const shortlistSchema = new mongoose.Schema({
  centre_id: {
    type: String,
    required: true
  },
  added_by: {
    type: String,
    default: ""
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
    shortlist: [shortlistSchema] //ADDED for Dish Search
  },
  { timestamps: true }
)

const Plan = mongoose.model("Plan", planSchema, "plan")

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
    {new: true}
  )
}