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
