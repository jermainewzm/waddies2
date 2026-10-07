const axios = require("axios")

const NEA_URL = "https://data.gov.sg/api/action/datastore_search?resource_id=d_bda4baa634dd1cc7a6c7cad5f19e2d68&limit=200"

exports.fetchAllCentres = async function() {
    const response = await axios.get(NEA_URL)
    return response.data.result.records
}

function parseDate(date) {
    if (!date || date === "NA" || date === "TBC" || date === 'nil') {
        return null
    }
    const parts = date.split("/")
    const day = Number(parts[0])
    const month = Number(parts[1])
    const year = Number(parts[2])

    return new Date(year, month - 1, day)
}

exports.formatCentre = function(record) {
    const closures = []
    // process the 4 quarterly cleanings first
    for (const q of ["q1", "q2", "q3", "q4"]) {
        const cleaningStartDate = parseDate(record[`${q}_cleaningstartdate`])
        const cleaningEndDate = parseDate(record[`${q}_cleaningenddate`])
        if (cleaningStartDate && cleaningEndDate) {
            closures.push({start: cleaningStartDate, end: cleaningEndDate, reason: "Cleaning"})
        }
    }

    // process other closings like repairs, redevelopments

    const workStartDate = parseDate(record.other_works_startdate)
    const workEndDate = parseDate(record.other_works_enddate)

    if (workStartDate && workEndDate ) {
        let reason = "Other works"
        if (record.remarks_other_works && record.remarks_other_works !== "nil") {
            reason = record.remarks_other_works.trim()
        }
        closures.push({start: workStartDate, end: workEndDate, reason: reason})
    }


    return {
        name: record.name,
        address: record.address_myenv,
        lat: Number(record.latitude_hc),
        lng: Number(record.longitude_hc),
        foodStalls : Number(record.no_of_food_stalls),
        photoUrl: record.photourl,
        description: record.description_myenv,
        closures: closures  
    }
}
