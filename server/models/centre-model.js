const mongoose = require("mongoose")

const closureSchema = new mongoose.Schema({
    start: {type: Date, required: true},
    end: {type: Date, required: true },
    reason: {type: String} //NEA's remarks e.g. "Repairs and Redecoration, Cleaning"
})

const centreSchema = new mongoose.Schema({
    serialNo : {type: String, required: true, unique: true},
    name: {type: String, required: true, unique: true},
    address: {type: String},
    lat: {type: Number, required: true},
    lng: {type: Number, required: true},
    foodStalls: {type: Number},
    photoUrl: {type: String},
    description: {type: String},
    closures: [closureSchema]
})

const Centre = mongoose.model("Centre", centreSchema, "centres")

exports.addCentre = function(centre) {
    return Centre.create(centre)
}

exports.countCentres = function() {
    return Centre.countDocuments()
}

exports.findSomeCentres = function(count) {
    return Centre.find().limit(count)
}

exports.findAllCentres = function() {
    return Centre.find()
}

//every centre A to Z by name (for the Centre Search dropdown)
exports.findAllCentresSorted = function() {
    return Centre.find().sort({name: 1})
}

//one centre by its NEA serialNo (ie. "72")
exports.findBySerial = function(serialNo) {
    return Centre.findOne({serialNo: String(serialNo)})
}

//many centres at once by serialNo ($in = "any of these")
exports.findBySerials = function(serialNos) {
    return Centre.find({serialNo: {$in: serialNos}})
}