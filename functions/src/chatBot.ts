import * as functions from "firebase-functions"
import { Client, validateSignature, WebhookEvent, Message, TextMessage, TemplateMessage, ImageMapMessage } from "@line/bot-sdk"
import * as Dialogflow from "apiai"
import * as MomentZone from "moment-timezone"
import * as memberService from "./services/memberService"
import * as praticeService from "./services/praticeService"
import * as chatbaseService from "./services/chatbaseService"
import * as weatherService from "./services/weatherService"
import * as PubSub from "@google-cloud/pubsub"
import * as queryString from 'query-string'
import * as Moment from 'moment'
import * as admin from 'firebase-admin'
//import * as lineLinkService from "./services/lineLinkService"

import { recordColumn, performanceColumn } from "./sheetColumn"
import { LINE, DIALOGFLOW, CHATBASE } from "./chatbotConfig"
import { MEMBER, PERFORMANCE, AIR, AIR_SORT} from "./model"
import { lineConfig, dialogflowConfig } from './chatbotConfig'


import { freemem } from "os";
import { text } from "body-parser";
import { user } from "firebase-functions/lib/providers/auth";


const lineClient = new Client({
    channelSecret: LINE.channelSecret,
    channelAccessToken: LINE.channelAccessToken
})
const dialogflowAgent = Dialogflow(DIALOGFLOW.agentToken)

export const webhook = functions.https.onRequest((req, res) => {
    const signature = req.headers["x-line-signature"] as string
    if (validateSignature(JSON.stringify(req.body), LINE.channelSecret, signature)) {
        const events = req.body.events as Array<WebhookEvent>
        events.forEach(event => eventDispatcher(event))
    }
    res.sendStatus(200)
})

const eventDispatcher = (event: WebhookEvent): void => {
    const userId = event.source.userId
    switch (event.type) {
        case "follow":
            replyFollowMessage(event.replyToken, userId)
            break
        case "unfollow":
            unfollow(userId)
            break
        case "message":
            if (event.message.type === "text") {
                const message = event.message.text
                if (event.source.type == "group")
                    chatbaseService.sendMessageToChatBase(userId, message, "discuss", "Line", "user", "Group")
                else
                    messageDispatcher(userId, message)
                console.log(event.message.type)
            }
            else if (event.message.type === "location") {//FIXME:
                const address = event.message.address
                const latitude = event.message.latitude     // 緯度
                const longitude = event.message.longitude   // 經度
                updateUserLocation(userId, address, latitude, longitude)
            }
            break
        default:
            break
    }
}
/* user follow chatbot */
const replyFollowMessage = async (replyToken: string, userId: string): Promise<any> => {
    const lineMessage: TextMessage = {
        type: "text",
        text: "歡迎加入智能跑步幫手RI~\nRI = Running Intelligence"
    }
    await replyMessage(replyToken, lineMessage)
    setDialogflowEvent(userId, "askForName")
}

const unfollow = async (userId: string) => {
    const member = await memberService.getMember(userId)
    memberService.deleteMember(member)
}

const messageDispatcher = (userId: string, message: string): void => {
    const request = dialogflowAgent.textRequest(message, { sessionId: userId })
    request.on("response", response => {
        actionDispatcher(userId, response.result)
        chatbaseService.sendMessageToChatBase(userId, response.result.resolvedQuery, response.result.metadata.intentName, "Line", "user")
    }).end()
    request.on("error", error => console.log("Error: ", error))
    console.log('shit')
}

const setDialogflowEvent = async (userId: string, eventName: string, eventParameter?: Object) => {
    const request = dialogflowAgent.eventRequest({
        name: eventName,
        data: eventParameter
    }, { sessionId: userId })
    request.on("response", response => {
        actionDispatcher(userId, response.result)
    }).end()
    request.on("error", error => console.log("Error: ", error))
}

const actionDispatcher = (userId: string, result: any, replyToken?: string): void => {
    console.log(JSON.stringify(result, null, 4))
    const action = result.action
    switch (action) {
        case "register.askForRegister":
            askForRegister(userId, result)
            break
        case "startRunning": // beginPractice
            startRunning(userId, result)
            break
        case "endRunning": // endPractice
            endRunning(userId, result)
            break
        case "showPerformance":
            showPerformance(userId, result)
            break
        default:
            pushErrorMessage(userId, result)
            break
    }
}
/* Register */
const askForRegister = async (userId: string, result: any) => {
    const name = result.parameters.name
    const member = await memberService.getMemberByName(name)
    //console.log(member)
    let url = "https://docs.google.com/forms/d/e/1FAIpQLSdTPHU7jTpFYUMeJvHUUTW9OLHI58YYVhl_GTAVmZJnqBUtVQ/viewform?usp=pp_url"
    if (member) // 會員已註冊
        url += `&entry.2119144834=${member.name}&entry.1152459710=${member.weight}&entry.1337116834=${member.height}&entry.515189027=${member.email}&entry.485262396=${userId}`
    else    // 新會員註冊
        url += `&entry.2119144834=${name}&entry.485262396=${userId}`

    setLocationState(userId,0)

    const lineMessage: TemplateMessage = {
        type: "template",
        altText: "This is a buttons template",
        template: {
            type: "buttons",
            title: "會員註冊",
            text: "請填寫會員資料",
            actions: [
                {
                    type: "uri",
                    label: "點擊填表",
                    uri: url
                }
            ]
        }
    }
    return pushMessage(userId, lineMessage);
}

const showPerformance = async (userId: string, result: any): Promise<any> => {
    const responseText = result.fulfillment.messages[0].speech as string
    const parameters = result.parameters
    if (parameters.lookfor !== "" && parameters.performance !== ""){
        const performance = await memberService.getMemberPerformance(userId)
        var distanceMeter = performance.totalRunningDist % 1000
        var distanceKilometer = (performance.totalRunningDist - distanceMeter)/1000
        distanceKilometer += distanceMeter/1000
        const lineMessage: TextMessage = {
            type: "text",
            text: "累計跑步距離 "+distanceKilometer+" km\n"+"里程排名第"+performance.rank+"名"
        }
        pushMessage(userId, lineMessage)
        const lineMessageB: TextMessage = {
            type: "text",
            text: "總計次數"+performance.runningCount+"次\n累計時數："+performance.totalRunningTime
        }
        pushMessage(userId, lineMessageB)
        chatbaseService.sendMessageToChatBase(userId, result.resolvedQuery, result.metadata.intentName, "Line", "user", "lookupPerformance")
    }
}

const startRunning = async (userId: string, result: any): Promise<any> => {
    const responseText = result.fulfillment.messages[0].speech as string
    const parameters = result.parameters
    if (parameters.run !== "" && parameters.begin !== "") {
        const member = await memberService.getMember(userId)
        if (await canStartRunning(member) === "canStartRunning") {
            memberService.updateMemberWorkState(member, "1")
            setLocationState(userId, 0)
            const now = MomentZone().tz("Asia/Taipei")
            await praticeService.createPracticeRecord(member, now.format("Y/M/D HH:mm"))
            //console.log(praticeService)
            const lineMessage: TextMessage = {
                type: "text",
                text: responseText.replace("{{startTime}}", now.format("Y/M/D HH:mm"))
            }
            pushMessage(userId, lineMessage)
            chatbaseService.sendMessageToChatBase(userId, result.resolvedQuery, result.metadata.intentName, "Line", "user", "Practice")
        }
        else if (await canStartRunning(member) === "running") {
            let practiceRecord = await memberService.getMemberRecord(member.lineId)
            const lineMessage: TextMessage[] = [
                {
                    type: "text",
                    text: "已開始紀錄您的跑步時間"
                },
                {
                    type: "text",
                    text: responseText.replace("{{startTime}}", practiceRecord.startTime)
                }
            ]
            pushMessage(userId, lineMessage)
        }
    } else
        pushErrorMessage(userId, result)
}

const endRunning = async (userId: string, result: any): Promise<any> => {
    const parameters = result.parameters
    if (parameters.run !== "" && parameters.end !== "") {
        const member = await memberService.getMember(userId)
        if (await canStartRunning(member) !== "canStartRunning" && await getLocationState(member) === "sentLocation") {
            const responseText = result.fulfillment.messages[0].speech as string
            memberService.updateMemberWorkState(member, "2")
            updatePraticeRecord(member, responseText)
        }
        /* 開始跑步沒有傳位置 */
        else if (await getLocationState(member) === "notSentLocation"){
            const responseText = result.fulfillment.messages[0].speech as string
            memberService.updateMemberWorkState(member, "0")
            updatePraticeRecord(member, responseText)
            let practiceRecord = await memberService.getMemberRecord(member.lineId)
            //北科大地址與經緯度
            await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.startLocation}${practiceRecord.id}:${recordColumn.startLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]])
            await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.startLatitude}${practiceRecord.id}:${recordColumn.startLongtitude}${practiceRecord.id}`, [[25.0422347,121.5385599]])
            await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.endLocation}${practiceRecord.id}:${recordColumn.endLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]])
            await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.endLatitude}${practiceRecord.id}:${recordColumn.endLongtitude}${practiceRecord.id}`, [[25.0422347,121.5385599]])
            const lineMessage: TextMessage = {
                type: "text",
                text: "您沒有傳送完整的「位置資訊」\n無法計算距離，本次紀錄不列入里程排名"
            }
            pushMessage(userId, lineMessage)
            console.log("dealing with exception")
        }
        else {
            const lineMessage: TextMessage = {
                type: "text",
                text: "尚未開使紀錄跑步狀態！"
            }
            pushMessage(userId, lineMessage)
        }
    } 
    else pushErrorMessage(userId, result)
}
//FIXME:
/* 只要傳送一個位置訊息，這裡便會被呼叫 */
const updateUserLocation = async (userId: string, address: string, latitude: number, longitude: number): Promise<any> =>{
    const member = await memberService.getMember(userId)
    let practiceRecord = await memberService.getMemberRecord(member.lineId)
    /* 開始跑步後，紀錄起點 */
    if(await canStartRunning(member) === "running"){
        setLocationState(userId,1)
        const rangeAddr = `${recordColumn.workspace}!${recordColumn.startLocation}${practiceRecord.id}:${recordColumn.startLocation}${practiceRecord.id}`
        const valueAddr = [[address]]
        await praticeService.updatePracticeRecord(rangeAddr, valueAddr)
        const range = `${recordColumn.workspace}!${recordColumn.startLatitude}${practiceRecord.id}:${recordColumn.startLongtitude}${practiceRecord.id}`
        const values = [
            [
                latitude,
                longitude
            ]
        ]
        await praticeService.updatePracticeRecord(range, values)
        chatbaseService.sendMessageToChatBase(userId, address, "startLocation", "Line", "user")
    }
    /* 結束跑步後，紀錄終點 */
    else if(await canStartRunning(member) === "justEndRunning" && await getLocationState(member) === "sentLocation"){
        const rangeAddr = `${recordColumn.workspace}!${recordColumn.endLocation}${practiceRecord.id}:${recordColumn.endLocation}${practiceRecord.id}`
        const valueAddr = [[address]]
        await praticeService.updatePracticeRecord(rangeAddr, valueAddr)
        const range = `${recordColumn.workspace}!${recordColumn.endLatitude}${practiceRecord.id}:${recordColumn.endLongtitude}${practiceRecord.id}`
        const values = [
            [
                latitude,
                longitude
            ]
        ]
        await praticeService.updatePracticeRecord(range, values)
        await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.distance}${practiceRecord.id}:${recordColumn.distance}${practiceRecord.id}`,[[`=calculateDistance(INDIRECT("J"&ROW()),INDIRECT("K"&ROW()),INDIRECT("L"&ROW()),INDIRECT("M"&ROW()))`]])
        memberService.updateMemberWorkState(member, "0")
        practiceRecord = await memberService.getMemberRecord(member.lineId)
        if(practiceRecord.distance >= 1000){
            var distanceMeter = practiceRecord.distance % 1000
            var distanceKilometer = (practiceRecord.distance - distanceMeter)/1000
            distanceKilometer += distanceMeter/1000
            const lineMessage: TextMessage = {
                type: "text",
                text: "本次大約跑了" + distanceKilometer + "公里"
            }
            pushMessage(userId, lineMessage)
        }
        else{
            var distanceMeter = practiceRecord.distance
            const lineMessage: TextMessage = {
                type: "text",
                text: "本次大約跑了" + distanceMeter + "公尺"
            }
            pushMessage(userId, lineMessage)
        }      
        chatbaseService.sendMessageToChatBase(userId, address, "endLocation", "Line", "user")
    }
    /* 一般狀態，查詢天氣 */
    else if (await canStartRunning(member) === "canStartRunning" && await getLocationState(member) === "sentLocation"){
        airReport(userId, latitude, longitude)
        chatbaseService.sendMessageToChatBase(userId, address, "weatherReport", "Line", "user")
        //TODO: weatherReport()
    }
    /* 例外處理1：上一次跑步結束時沒有傳位置訊息*/
    else if (await canStartRunning(member) === "canStartRunning" && await getLocationState(member) === "notSentLocation"){
        setLocationState(userId,1)
        airReport(userId, latitude, longitude)
        chatbaseService.sendMessageToChatBase(userId, address, "weatherReport", "Line", "user")
        //北科大地址與經緯度
        await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.startLocation}${practiceRecord.id}:${recordColumn.startLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]])
        await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.startLatitude}${practiceRecord.id}:${recordColumn.startLongtitude}${practiceRecord.id}`, [[25.0422347,121.5385599]])
        await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.endLocation}${practiceRecord.id}:${recordColumn.endLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]])
        await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.endLatitude}${practiceRecord.id}:${recordColumn.endLongtitude}${practiceRecord.id}`, [[25.0422347,121.5385599]])
        const lineMessage: TextMessage = {
            type: "text",
            text: "附帶一提，您上次沒有傳送完整的「位置資訊」\n無法計算距離，該次紀錄不列入里程排名"
        }
        pushMessage(userId, lineMessage)
        console.log("dealing with exception")
    }
}

const updatePraticeRecord = async (member: MEMBER, responseText: string) => {
    const now = MomentZone().tz("Asia/Taipei")

    let practiceRecord = await memberService.getMemberRecord(member.lineId)

    const range = `${recordColumn.workspace}!${recordColumn.endTime}${practiceRecord.id}:${recordColumn.totalTime}${practiceRecord.id}`
    const values = [
        [
            now.format("Y/M/D HH:mm:ss"),
            `=TEXT(IF(INDIRECT("D"&ROW())<>"",INDIRECT("D"&ROW())-INDIRECT("C"&ROW()), ""),"hh:mm:ss")`
        ]
    ]
    await praticeService.updatePracticeRecord(range, values)

    const convertTimeRange = `${recordColumn.workspace}!${recordColumn.timeCalc}${practiceRecord.id}:${recordColumn.timeCalc}${practiceRecord.id}`
    const convertTimeValues = [
        [
            `=TIMEVALUE(MID(INDIRECT("${recordColumn.totalTime}"&ROW()),1,8))`
        ]
    ]
    await praticeService.updatePracticeRecord(convertTimeRange, convertTimeValues)

    let practiceRecordMessage = await memberService.getMemberRecord(member.lineId)
    //console.log(practiceRecordMessage)
    const performance = await memberService.getMemberPerformance(member.lineId)
    if(await getLocationState(member) === "sentLocation"){
        const lineMessage: TextMessage = {
            type: "text",
            text: responseText.replace("{{runningCount}}", performance.runningCount)
                .replace("{{totalTime}}", practiceRecordMessage.totalTime)
                .replace("{{startTime}}", practiceRecordMessage.startTime)
                .replace("{{endTime}}", practiceRecordMessage.endTime)
                .replace("{{totalRunningTime}}", performance.totalRunningTime)
        }
        pushMessage(member.lineId, lineMessage)
    }
    else if (await getLocationState(member) === "notSentLocation"){
        await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.startLocation}${practiceRecord.id}:${recordColumn.startLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]])
        await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.startLatitude}${practiceRecord.id}:${recordColumn.startLongtitude}${practiceRecord.id}`, [[25.0422347,121.5385599]])
        await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.endLocation}${practiceRecord.id}:${recordColumn.endLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]])
        await praticeService.updatePracticeRecord(`${recordColumn.workspace}!${recordColumn.endLatitude}${practiceRecord.id}:${recordColumn.endLongtitude}${practiceRecord.id}`, [[25.0422347,121.5385599]])
        const lineMessage: TextMessage = {
            type: "text",
            text: responseText.replace("請傳送位置訊息，才能統計距離哦","您沒有傳送完整的「位置資訊」\n無法計算距離，本次紀錄不列入里程排名")
                .replace("{{runningCount}}", performance.runningCount)
                .replace("{{totalTime}}", practiceRecordMessage.totalTime)
                .replace("{{startTime}}", practiceRecordMessage.startTime)
                .replace("{{endTime}}", practiceRecordMessage.endTime)
                .replace("{{totalRunningTime}}", performance.totalRunningTime)
        }
        pushMessage(member.lineId, lineMessage)
    }
}

const canStartRunning = async (member: MEMBER): Promise<"canStartRunning" | "justEndRunning" | "running"> => {
    if (member.workState == "1")
        return "running"
    else if (member.workState == "2")
        return "justEndRunning"
    else
        return "canStartRunning"
}

const canEndRunning = (member: MEMBER): Boolean => {
    return member.workState != "0"
}

const resetRunningState = async (userId: string) => {
    const member = await memberService.getMember(userId)
    if (member.workState != "0")
        memberService.updateMemberWorkState(member, "0")
}

const setLocationState = async (userId: string, state: number) => {
    const member = await memberService.getMember(userId)
    memberService.updateLocationState(member, state)
}

const getLocationState = async (member: MEMBER): Promise<"notSentLocation" | "sentLocation"> => {
    if(member.locationState == 0)
        return "notSentLocation"
    else
        return "sentLocation"
}

export const pushTextMessage = functions.https.onRequest((req, res) => {
    const message = req.body.message
    const lineId = req.body.lineId
    const textMessage: TextMessage = {
        type: "text",
        text: message
    }
    pushMessage(lineId, textMessage)
    res.sendStatus(200)
})

export const sendPerformanceReport = functions.https.onRequest(async (req, res) => {
    const memberPerformance = req.body as [{ member: MEMBER, performance: PERFORMANCE }]
    await Promise.all([sendReportToMembers(memberPerformance)])
    res.sendStatus(200)
})

const sendReportToMembers = (data: [{ member: MEMBER, performance: PERFORMANCE }]): Promise<any> => {
    const promises = new Array<Promise<any>>()
    for (const memberPerformance of data) {
        const lineMessage = {
            type: "text",
            text: `${MomentZone().tz("Asia/Taipei").format("M月D日")} ${memberPerformance.performance.name}\n\n` +
                `跑步次數：${memberPerformance.performance.runningCount}\n：${memberPerformance.performance.runningCount}\n` +
                `跑步時間：${memberPerformance.performance.totalRunningTime}\n` +
                `時間排名：${memberPerformance.performance.rank}\n`+
                `里程總計：${memberPerformance.performance.totalRunningDist}\n`
        } as TextMessage
        promises.push(pushMessage(memberPerformance.member.lineId, lineMessage))
    }
    return Promise.all(promises)
}

const pushCommandMessage = (userId: string): Promise<any> => {
    const lineMessage: TextMessage = {
        type: "text",
        text: `《智能跑步幫手》系統指令如下，請多利用：\n1. 查詢天氣\n2. 開始/結束跑步\n3. 查詢紀錄\n4. 任務種類`
    }
    return pushMessage(userId, lineMessage)
}

/*
const weatherReport = (userId: string, weather: WEATHER, location: string): Promise<any> =>{
    const lineMessage: TextMessage = {
        type: "text",
        text: ``
    }
    return pushMessage(userId, lineMessage)
}*/

const pushErrorMessage = async (userId: string, result: any): Promise<any> => {
    const lineMessage: TextMessage = {
        type: "text",
        text: (result.fulfillment.messages[0].speech as string).replace("{{message}}", result.resolvedQuery)
    }
    pushMessage(userId, lineMessage)
}

const replyMessage = (replyToken: string, lineMessage: Message | Array<Message>): Promise<any> => {
    return lineClient.replyMessage(replyToken, lineMessage)
}

const pushMessage = (userId: string, lineMessage: Message | Array<Message>): Promise<any> => {
    if (Array.isArray(lineMessage)) {
        for (const message of lineMessage) {
            if (message.type === "text")
                chatbaseService.sendMessageToChatBase(userId, message.text, "reply", "Line", "agent")
            else
                chatbaseService.sendMessageToChatBase(userId, `This is a ${message.type} template message`, "reply", "Line", "agent")
        }
    } else {
        if (lineMessage.type === "text")
            chatbaseService.sendMessageToChatBase(userId, lineMessage.text, "reply", "Line", "agent")
        else
            chatbaseService.sendMessageToChatBase(userId, `This is a ${lineMessage.type} template message`, "reply", "Line", "agent")
    }
    return lineClient.pushMessage(userId, lineMessage)
}

const airReport = async (userId: string, userLat: number, userLng: number): Promise<any> => {
    const air:Array<AIR> = await weatherService.getAir()
    //console.log(air)
    const unsorted:Array<AIR_SORT> = []
    let distance: Array<number> = []
    let sorted = []
    for(let i = 0; i < air.length; i++){
        distance[i] = (userLat - air[i].lat)*(userLat - air[i].lat) + (userLng - air[i].lng)*(userLng - air[i].lng)
        //console.log(distance[i])
        unsorted[i] = {
            siteName: air[i].siteName,
            status: air[i].status,
            pm25avg: air[i].pm25avg,
            pm10avg: air[i].pm10avg,
            lat: air[i].lat,
            lng: air[i].lng,
            timestamp: air[i].timestamp,
            distance: distance[i]
        }
        sorted[i] = distance[i]
    }
    sorted.sort()
    console.log(sorted[0])    
    let j = 0
    let sortedAir:AIR_SORT
    while(true){
        if (sorted[0] == unsorted[j].distance){
            sortedAir = unsorted[j]
            break
        }
        j++
    }
    console.log(sortedAir)
    //var sortedAir = unsorted.sort((left,right) => left.distance - right.distance)
    /*
    const sortedAir = unsorted.sort((left, right) => {
        if (parseInt(`${left.distance}`) < parseInt(`${right.distance}`))
            return -1
        if (parseInt(`${left.distance}`) > parseInt(`${right.distance}`))
            return 1
        return 0
    })*/
    const lineMessage: TextMessage = {
        type: "text",
        text: `您附近的空氣品質：`+sortedAir["status"]+`\nPM 2.5 平均指標：`+sortedAir["pm25avg"]+`\nPM 10 平均指標：`+sortedAir["pm10avg"]+`\n資料來自最近測站 `+sortedAir["siteName"]+`\n最後更新時間：`+sortedAir["timestamp"]
    }
    pushMessage(userId, lineMessage)
}
