import * as googleSheets from "../services/sheetService"
/*
import { outLineColumn } from "../sheetColumn"
import { OutLine } from "../model";

export const getLineLink = async (now: string) => {
    const auth = await googleSheets.authorize()
    const queryString = `select ${outLineColumn.date}, ${outLineColumn.topic}, ${outLineColumn.url} where ${outLineColumn.date} = date '${now}'`
    console.log(queryString)
    const values = await googleSheets.querySheet(auth, queryString, outLineColumn.sheetId, outLineColumn.gid)
    const outLine = {
        date: values[0][0],
        topic: values[0][1],
        url: values[0][2]
    } as OutLine
    console.log(outLine)
    return outLine
}*/