const { getDistance } = require("./shortlist-helper")

//Get a list of member ids as text to track who have sent their swipes
exports.getFinishedIds = function(plan) {
    const ids = []
    
    for (const swipe of plan.swipes) {
        if (!ids.includes(String(swipe.memberId))) {
            ids.push(String(swipe.memberId))
        }
    }

    return ids
}

//For every shortlisted centre, how many members liked it and how far everyone will travel in total.
//returns best first
//centresBySerial = { "72": centre document, ... } from the controller
exports.getResults = function(plan, centresBySerial) {
    const results = []

    for (const item of plan.shortlist) {
        const centre = centresBySerial[String(item.serialNo)]   //find the centre by its serialNo

        if (!centre) {      //if centre no longer exists
            continue
        }

        let likes = 0
        for (const swipe of plan.swipes) {
            if (String(swipe.centreId) === String(centre.serialNo) && swipe.liked) {   //swipes save the serialNo
                likes++
            }
        }

        let totalDist = 0
        for (const member of plan.members) {
            totalDist += getDistance(member, centre)    //using getDistance as a stand in for travel time. Can change to real route timing once OneMap routing is done
        }

        results.push({
            centreId: centre.serialNo,   //serialNo
            name: centre.name,
            address: centre.address,
            photoUrl: centre.photoUrl,
            likes: likes,
            totalDist: Math.round(totalDist * 10) / 10 //in km, to 1 d.p.
        })
    }

    //sort in most likes first, if tied then look at smallest total distance
    results.sort((a,b) => b.likes - a.likes || a.totalDist - b.totalDist)

    return results
}