import * as googleSheets from "../services/sheetService"
import { recordColumn , performanceColumn} from "../sheetColumn"
import { MEMBER } from "../model"

export const createPracticeRecord = async (member: MEMBER, time: string) => {
    const auth = await googleSheets.authorize()
    const values = [
        [
            "=ROW()",       // id
            member.name,    // name
            time,           // startTime
            undefined,      // endTime
            undefined,      // totalTime
            undefined,      // startLocation(address)
            undefined,      // endLocation(address)
            undefined,      // distance
            member.lineId,  // lineId
        ]
    ]
    await googleSheets.appendSheet(auth, recordColumn.sheetId, encodeURI(recordColumn.workspace), values)
}

export const updatePracticeRecord = async (range: string, values: any) => {
    const auth = await googleSheets.authorize()
    await googleSheets.writeSheet(auth, recordColumn.sheetId, encodeURI(range), values)
}
/*
export const updatePerformance = async (range: string, values: any) => {
    const auth = await googleSheets.authorize()
    await googleSheets.writeSheet(auth, performanceColumn.sheetId, encodeURI(range), values)
}*/