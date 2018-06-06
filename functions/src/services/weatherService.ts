import * as googleSheets from "../services/sheetService"
import { MEMBER, WEATHER, AIR, STATION } from "../model"
import { memberColumn, weatherColumn, airColumn, stationColumn } from "../sheetColumn"
import { WSAEINVALIDPROVIDER } from "constants";

export const getAir = async () => {
    const auth = await googleSheets.authorize()
    const values = await googleSheets.readSheet(auth, airColumn.sheetId, encodeURI(airColumn.workspace))
    //console.log(values)
    let air: Array<AIR> = []
    for (let i = 1; i < values.length; i++) {
        const airValue = values[i]
        let data = {
            siteName: airValue[0],
            status: airValue[1],
            pm25avg: airValue[2],
            pm10avg: airValue[3],
            lat: airValue[4],
            lng: airValue[5],
            timestamp: airValue[6]
        }as AIR
        air.push(data)
    }
    return air
}