import * as googleSheets from "../services/sheetService"
import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { memberColumn } from "../sheetColumn"
import { MEMBER, RECORD, PERFORMANCE} from "../model";
import { recordColumn, performanceColumn} from "../sheetColumn"
import { User, Member } from "../firestoreModel"
//import { google, GoogleApis } from "googleapis";

const firestore = admin.firestore()
const userCollection = firestore.collection("User")

export const getMember = async (userId: string) => {
    const auth = await googleSheets.authorize()
    const queryString = `select ${memberColumn.id},`+
    `${memberColumn.name},`+
    `${memberColumn.weight},`+
    `${memberColumn.height},`+
    `${memberColumn.email},`+
    `${memberColumn.lineId},`+
    `${memberColumn.workState}`+
    ` where ${memberColumn.lineId} = '${userId}'`
    const values = await googleSheets.querySheet(auth, queryString, memberColumn.sheetId, memberColumn.gid)
    const member = {
        id: values[0][0],
        name: values[0][1],
        weight: values[0][2],
        height: values[0][3],
        email: values[0][4],
        lineId: values[0][5],
        workState: values[0][6]
    } as MEMBER
    return member
}

export const getMemberByName = async (name: string) => {
    const auth = await googleSheets.authorize()
    const queryString = `select ${memberColumn.id},${memberColumn.name},${memberColumn.weight},${memberColumn.height},${memberColumn.email},${memberColumn.lineId},${memberColumn.workState} where ${memberColumn.name} = '${name}'`
    const values = await googleSheets.querySheet(auth, queryString, memberColumn.sheetId, memberColumn.gid)
    //console.log(values)
    if (values.length) {
        const member = {
            id: values[0][0],
            name: values[0][1],
            weight: values[0][2],
            height: values[0][3],
            email: values[0][4],
            lineId: values[0][5],
            workState: values[0][6]
        } as MEMBER
        //console.log(member)
        return member
    }
    return null
}

export const getMemberPerformance = async (lineId: string) => {
    const auth = await googleSheets.authorize()
    const queryString = `select ${performanceColumn.id},` +
        `${performanceColumn.lineId},` +
        `${performanceColumn.name},` +
        `${performanceColumn.runningCount},` +
        `${performanceColumn.totalRunningTime},` +
        `${performanceColumn.totalRunningDist},` +
        `${performanceColumn.missionCount},` +
        `${performanceColumn.rank}` +
        ` where ${performanceColumn.lineId} = '${lineId}'`
    //console.log(queryString)
    const values = await googleSheets.querySheet(auth, queryString, performanceColumn.sheetId, performanceColumn.gid)
    const performance = {
        id: values[0][0],
        lineId: values[0][1],
        name: values[0][2],
        runningCount: values[0][3],
        totalRunningTime: values[0][4],
        totalRunningDist: values[0][5],
        missionCount: values[0][6],
        rank: values[0][7]
    } as PERFORMANCE

    return performance
}

export const getMemberRecord = async (lineId: string) => {
    const auth = await googleSheets.authorize()
    const queryString = `select ${recordColumn.id},` +
    `${recordColumn.name},` +
    `${recordColumn.startTime},` +
    `${recordColumn.endTime},` +
    `${recordColumn.totalTime},` +
    `${recordColumn.startLocation},` +
    `${recordColumn.endLocation},` +
    `${recordColumn.distance},` +
    `${recordColumn.lineId},` +
    `${recordColumn.startLatitude},` +
    `${recordColumn.startLongtitude},` +
    `${recordColumn.endLatitude},` +
    `${recordColumn.endLongtitude},` +
    `${recordColumn.timeCalc}` +
    ` where ${recordColumn.lineId} = '${lineId}' order by ${recordColumn.id} DESC limit 1`
    const values = await googleSheets.querySheet(auth, queryString, recordColumn.sheetId, recordColumn.gid)
    //console.log(values)
    const record = {
        id: values[0][0],
        name: values[0][1],
        startTime: values[0][2],
        endTime: values[0][3],
        totalTime: values[0][4],
        startLocation: values[0][5],
        endLocation: values[0][6],
        distance: values[0][7],
        lineId: values[0][8],
        startLatitude: values[0][9],
        startLongtitude: values[0][10],
        endLatitude: values[0][11],
        endLongtitude: values[0][12],
        timeCalc: values[0][13]
    } as RECORD
    return record
}
/*
export const getWeather = async (location: string) => {
    const auth = await googleSheets.authorize()
    const queryString = `select${weatherColumn.siteName},${weatherColumn.temp},${weatherColumn.rain},${weatherColumn.weather} where ${weatherColumn.siteName}=${location}`
    const values = await googleSheets.querySheet(auth, queryString, recordColumn.sheetId, recordColumn.gid)
    console.log(values)
    const weather = {
        siteName: values[0][0],
        temp: values[0][1],
        rain: values[0][2],
        weather: values[0][3]
    } as WEATHER
    return weather
}*/

export const updateMemberWorkState = async (member: MEMBER, workState: string) => {
    const auth = await googleSheets.authorize()
    const range = encodeURI(`${memberColumn.workspace}!${memberColumn.workState}${member.id}:${memberColumn.workState}${member.id}`)
    googleSheets.writeSheet(auth, memberColumn.sheetId, range, [[workState]]);
}

export const updateLocationState = async (member: MEMBER, state: number) => {
    const auth = await googleSheets.authorize()
    const range = encodeURI(`${memberColumn.workspace}!${memberColumn.locationState}${member.id}:${memberColumn.locationState}${member.id}`)
    googleSheets.writeSheet(auth, memberColumn.sheetId, range, [[state]])
}

export const deleteMember = async (member: MEMBER) => {
    //console.log(member)
    const auth = await googleSheets.authorize()
    let range = encodeURI(`${memberColumn.workspace}!${memberColumn.lineId}${member.id}:${memberColumn.lineId}${member.id}`)
    googleSheets.clearSheet(auth, memberColumn.sheetId, range)
}
/*
export const getFirestoreUser = async (lineId: string) => {
    let query = userCollection.where('lineId', '==', lineId).get()
        .then(snapshot => {
            console.log(snapshot)
        })
}*/
