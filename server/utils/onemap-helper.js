const axios = require("axios")

let validToken = null
let tokenExpiry = 0

async function getToken() {
    const currentTime = Date.now() / 1000 // OneMap gives token expiry in seconds so we divide by 1000  //

    // Reuse the saved token if it still has more than 60 seconds left
    // (renewing a minute early so it never expires mid-request)
    if (validToken && currentTime < tokenExpiry - 60) {
        return validToken
    }

     // Else, we have no valid token: log in to OneMap for a new one
    const response = await axios.post("https://www.onemap.gov.sg/api/auth/post/getToken", {
         email: process.env.ONEMAP_EMAIL,
         password: process.env.ONEMAP_PASSWORD       
    })
    validToken = response.data.access_token
    tokenExpiry = Number(response.data.expiry_timestamp)

    return validToken

}

exports.getLatLng = async function (postal) {
    const response = await axios.get("https://www.onemap.gov.sg/api/common/elastic/search",
        {params: {searchVal : postal, returnGeom:"Y", getAddrDetails:"Y", pageNum: 1 },
        headers: {Authorization: await getToken()}
    })

        /* failed request: {
            "found": 0,
            "totalNumPages": 0,
            "pageNum": 1,
            "results": []
        } */

    if (response.data.found === 0) {
        return null
    }

    const result = response.data.results[0]
    return {lat: Number(result.LATITUDE), lng: Number(result.LONGITUDE)}

}

//OneMap routing wants MM-DD-YYYY, while plan.date is YYYY-MM-DD, so we need to convert
function toRoutingDate(planDate) {
    const [year, month, day] = planDate.split("-")
    return `${month}-${day}-${year}`

}

/* Public transport route from one point to another, at the plan's date and time.
   start/end are { lat, lng }. Returns null if no route is found. */

exports.getRoute = async function (start, end, planDate, planTime, centreName) {
    const response = await axios.get("https://www.onemap.gov.sg/api/public/routingsvc/route" , {
        params: {
            start: `${start.lat},${start.lng}`,
            end: `${end.lat},${end.lng}`,
            routeType: "pt",
            mode: "TRANSIT",
            date: toRoutingDate(planDate),
            time: `${planTime}:00`, // plans store "12:00", routing wants "12:00:00"
            maxWalkDistance: 2000,
            numItineraries: 1
        },
        headers: {Authorization: await getToken()}
    })

    const itineraries = response.data.plan.itineraries

    if (!itineraries || itineraries.length === 0) {
        return null
    }   
    const bestRoute = itineraries[0]

    const legs = []

    for (const leg of bestRoute.legs) {
        legs.push({
            mode: leg.mode,
            minutes: Math.round(leg.duration /60),
            service: leg.routeShortName || "",
            to: leg.to.name === "Destination" ? centreName : leg.to.name,
            geometry: leg.legGeometry.points
        })
    }

    return {
        totalMinutes: Math.round(bestRoute.duration /60 ),
        fare: bestRoute.fare,
        transfers: bestRoute.transfers,
        legs: legs
    }
}

