"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const bot_sdk_1 = require("@line/bot-sdk");
const Dialogflow = require("apiai");
const MomentZone = require("moment-timezone");
const memberService = require("./services/memberService");
const groupService = require("./services/groupService");
const praticeService = require("./services/praticeService");
const chatbaseService = require("./services/chatbaseService");
const weatherService = require("./services/weatherService");
//import * as lineLinkService from "./services/lineLinkService"
const sheetColumn_1 = require("./sheetColumn");
const chatbotConfig_1 = require("./chatbotConfig");
const lineClient = new bot_sdk_1.Client({
    channelSecret: chatbotConfig_1.LINE.channelSecret,
    channelAccessToken: chatbotConfig_1.LINE.channelAccessToken
});
const dialogflowAgent = Dialogflow(chatbotConfig_1.DIALOGFLOW.agentToken);
exports.webhook = functions.https.onRequest((req, res) => {
    const signature = req.headers["x-line-signature"];
    if (bot_sdk_1.validateSignature(JSON.stringify(req.body), chatbotConfig_1.LINE.channelSecret, signature)) {
        const events = req.body.events;
        events.forEach(event => eventDispatcher(event));
    }
    res.sendStatus(200);
});
const eventDispatcher = (event) => {
    const userId = event.source.userId;
    switch (event.type) {
        case "follow":
            replyFollowMessage(event.replyToken, userId);
            break;
        case "unfollow":
            unfollow(userId);
            break;
        case "join":
            if (event.source.type == "group")
                replyJoinMessage(event.replyToken, event.source.groupId);
            break;
        case "leave":
            if (event.source.type == "group")
                leave(event.source.groupId);
            break;
        case "message":
            if (event.message.type === "text") {
                const message = event.message.text;
                if (event.source.type == "group")
                    chatbaseService.sendMessageToChatBase(userId, message, "discuss", "Line", "user", "Group");
                else
                    messageDispatcher(userId, message);
                console.log(event.message.type);
            }
            else if (event.message.type === "location") {
                const address = event.message.address;
                const latitude = event.message.latitude; // 緯度
                const longitude = event.message.longitude; // 經度
                updateUserLocation(userId, address, latitude, longitude);
            }
            break;
        default:
            break;
    }
};
/* user follow chatbot */
const replyFollowMessage = (replyToken, userId) => __awaiter(this, void 0, void 0, function* () {
    const lineMessage = {
        type: "text",
        text: "歡迎加入智能跑步幫手RI~\nRI = Running Intelligence"
    };
    yield replyMessage(replyToken, lineMessage);
    setDialogflowEvent(userId, "askForName");
});
const unfollow = (userId) => __awaiter(this, void 0, void 0, function* () {
    const member = yield memberService.getMember(userId);
    memberService.deleteMember(member);
});
/* Join Group */
const replyJoinMessage = (replyToken, groupId) => {
    const url = `https://docs.google.com/forms/d/e/1FAIpQLSe4OegRN6xCWQGUyTl3MOmNZSLUyetSIoMnqrRXgcqn9FZKNg/viewform?usp=pp_url&entry.2066429067=${groupId}`;
    const lineMessage = {
        type: "text",
        text: `我是《智能跑步幫手》\n很高興受邀加入貴群組【${groupId}】\n\n請你填表幫我長智慧，讓我知道這個群組的相關資料`
    };
    const buttonsMessage = {
        type: "template",
        altText: "This is a buttons template",
        template: {
            type: "buttons",
            title: "智能跑步幫手",
            text: "請填寫表單",
            actions: [
                {
                    type: "uri",
                    label: "點擊填寫",
                    uri: url
                }
            ]
        }
    };
    return replyMessage(replyToken, [lineMessage, buttonsMessage]);
};
const leave = (groupId) => __awaiter(this, void 0, void 0, function* () {
    const group = yield groupService.getGroup(groupId);
    groupService.deleteGroup(group);
});
const messageDispatcher = (userId, message) => {
    const request = dialogflowAgent.textRequest(message, { sessionId: userId });
    request.on("response", response => {
        actionDispatcher(userId, response.result);
        chatbaseService.sendMessageToChatBase(userId, response.result.resolvedQuery, response.result.metadata.intentName, "Line", "user");
    }).end();
    request.on("error", error => console.log("Error: ", error));
    console.log('shit');
};
const setDialogflowEvent = (userId, eventName, eventParameter) => __awaiter(this, void 0, void 0, function* () {
    const request = dialogflowAgent.eventRequest({
        name: eventName,
        data: eventParameter
    }, { sessionId: userId });
    request.on("response", response => {
        actionDispatcher(userId, response.result);
    }).end();
    request.on("error", error => console.log("Error: ", error));
});
const actionDispatcher = (userId, result, replyToken) => {
    console.log(JSON.stringify(result, null, 4));
    const action = result.action;
    switch (action) {
        case "register.askForRegister":
            askForRegister(userId, result);
            break;
        case "startRunning":// beginPractice
            startRunning(userId, result);
            break;
        case "endRunning":// endPractice
            endRunning(userId, result);
            break;
        case "showPerformance":
            showPerformance(userId, result);
            break;
        default:
            pushErrorMessage(userId, result);
            break;
    }
};
/* Register */
const askForRegister = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const name = result.parameters.name;
    const member = yield memberService.getMemberByName(name);
    //console.log(member)
    let url = "https://docs.google.com/forms/d/e/1FAIpQLSdTPHU7jTpFYUMeJvHUUTW9OLHI58YYVhl_GTAVmZJnqBUtVQ/viewform?usp=pp_url";
    if (member)
        url += `&entry.2119144834=${member.name}&entry.1152459710=${member.weight}&entry.1337116834=${member.height}&entry.515189027=${member.email}&entry.485262396=${userId}`;
    else
        url += `&entry.2119144834=${name}&entry.485262396=${userId}`;
    setLocationState(userId, 0);
    const lineMessage = {
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
    };
    return pushMessage(userId, lineMessage);
});
const showPerformance = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const responseText = result.fulfillment.messages[0].speech;
    const parameters = result.parameters;
    if (parameters.lookfor !== "" && parameters.performance !== "") {
        const performance = yield memberService.getMemberPerformance(userId);
        var distanceMeter = performance.totalRunningDist % 1000;
        var distanceKilometer = (performance.totalRunningDist - distanceMeter) / 1000;
        distanceKilometer += distanceMeter / 1000;
        const lineMessage = {
            type: "text",
            text: "累計跑步距離 " + distanceKilometer + " km\n" + "里程排名第" + performance.rank + "名"
        };
        pushMessage(userId, lineMessage);
        const lineMessageB = {
            type: "text",
            text: "總計次數" + performance.runningCount + "次\n累計時數：" + performance.totalRunningTime
        };
        pushMessage(userId, lineMessageB);
        chatbaseService.sendMessageToChatBase(userId, result.resolvedQuery, result.metadata.intentName, "Line", "user", "lookupPerformance");
    }
});
const startRunning = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const responseText = result.fulfillment.messages[0].speech;
    const parameters = result.parameters;
    if (parameters.run !== "" && parameters.begin !== "") {
        const member = yield memberService.getMember(userId);
        if ((yield canStartRunning(member)) === "canStartRunning") {
            memberService.updateMemberWorkState(member, "1");
            setLocationState(userId, 0);
            const now = MomentZone().tz("Asia/Taipei");
            yield praticeService.createPracticeRecord(member, now.format("Y/M/D HH:mm"));
            //console.log(praticeService)
            const lineMessage = {
                type: "text",
                text: responseText.replace("{{startTime}}", now.format("Y/M/D HH:mm"))
            };
            pushMessage(userId, lineMessage);
            chatbaseService.sendMessageToChatBase(userId, result.resolvedQuery, result.metadata.intentName, "Line", "user", "Practice");
        }
        else if ((yield canStartRunning(member)) === "running") {
            let practiceRecord = yield memberService.getMemberRecord(member.lineId);
            const lineMessage = [
                {
                    type: "text",
                    text: "已開始紀錄您的跑步時間"
                },
                {
                    type: "text",
                    text: responseText.replace("{{startTime}}", practiceRecord.startTime)
                }
            ];
            pushMessage(userId, lineMessage);
        }
    }
    else
        pushErrorMessage(userId, result);
});
const endRunning = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const parameters = result.parameters;
    if (parameters.run !== "" && parameters.end !== "") {
        const member = yield memberService.getMember(userId);
        if ((yield canStartRunning(member)) !== "canStartRunning" && (yield getLocationState(member)) === "sentLocation") {
            const responseText = result.fulfillment.messages[0].speech;
            memberService.updateMemberWorkState(member, "2");
            updatePraticeRecord(member, responseText);
        }
        else if ((yield getLocationState(member)) === "notSentLocation") {
            const responseText = result.fulfillment.messages[0].speech;
            memberService.updateMemberWorkState(member, "0");
            updatePraticeRecord(member, responseText);
            let practiceRecord = yield memberService.getMemberRecord(member.lineId);
            //北科大地址與經緯度
            yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.startLocation}${practiceRecord.id}:${sheetColumn_1.recordColumn.startLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]]);
            yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.startLatitude}${practiceRecord.id}:${sheetColumn_1.recordColumn.startLongtitude}${practiceRecord.id}`, [[25.0422347, 121.5385599]]);
            yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.endLocation}${practiceRecord.id}:${sheetColumn_1.recordColumn.endLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]]);
            yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.endLatitude}${practiceRecord.id}:${sheetColumn_1.recordColumn.endLongtitude}${practiceRecord.id}`, [[25.0422347, 121.5385599]]);
            const lineMessage = {
                type: "text",
                text: "您沒有傳送完整的「位置資訊」\n無法計算距離，本次紀錄不列入里程排名"
            };
            pushMessage(userId, lineMessage);
            console.log("dealing with exception");
        }
        else {
            const lineMessage = {
                type: "text",
                text: "尚未開使紀錄跑步狀態！"
            };
            pushMessage(userId, lineMessage);
        }
    }
    else
        pushErrorMessage(userId, result);
});
//FIXME:
/* 只要傳送一個位置訊息，這裡便會被呼叫 */
const updateUserLocation = (userId, address, latitude, longitude) => __awaiter(this, void 0, void 0, function* () {
    const member = yield memberService.getMember(userId);
    let practiceRecord = yield memberService.getMemberRecord(member.lineId);
    /* 開始跑步後，紀錄起點 */
    if ((yield canStartRunning(member)) === "running") {
        setLocationState(userId, 1);
        const rangeAddr = `${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.startLocation}${practiceRecord.id}:${sheetColumn_1.recordColumn.startLocation}${practiceRecord.id}`;
        const valueAddr = [[address]];
        yield praticeService.updatePracticeRecord(rangeAddr, valueAddr);
        const range = `${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.startLatitude}${practiceRecord.id}:${sheetColumn_1.recordColumn.startLongtitude}${practiceRecord.id}`;
        const values = [
            [
                latitude,
                longitude
            ]
        ];
        yield praticeService.updatePracticeRecord(range, values);
        chatbaseService.sendMessageToChatBase(userId, address, "startLocation", "Line", "user");
    }
    else if ((yield canStartRunning(member)) === "justEndRunning" && (yield getLocationState(member)) === "sentLocation") {
        const rangeAddr = `${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.endLocation}${practiceRecord.id}:${sheetColumn_1.recordColumn.endLocation}${practiceRecord.id}`;
        const valueAddr = [[address]];
        yield praticeService.updatePracticeRecord(rangeAddr, valueAddr);
        const range = `${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.endLatitude}${practiceRecord.id}:${sheetColumn_1.recordColumn.endLongtitude}${practiceRecord.id}`;
        const values = [
            [
                latitude,
                longitude
            ]
        ];
        yield praticeService.updatePracticeRecord(range, values);
        yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.distance}${practiceRecord.id}:${sheetColumn_1.recordColumn.distance}${practiceRecord.id}`, [[`=calculateDistance(INDIRECT("J"&ROW()),INDIRECT("K"&ROW()),INDIRECT("L"&ROW()),INDIRECT("M"&ROW()))`]]);
        memberService.updateMemberWorkState(member, "0");
        practiceRecord = yield memberService.getMemberRecord(member.lineId);
        if (practiceRecord.distance >= 1000) {
            var distanceMeter = practiceRecord.distance % 1000;
            var distanceKilometer = (practiceRecord.distance - distanceMeter) / 1000;
            distanceKilometer += distanceMeter / 1000;
            const lineMessage = {
                type: "text",
                text: "本次大約跑了" + distanceKilometer + "公里"
            };
            pushMessage(userId, lineMessage);
        }
        else {
            var distanceMeter = practiceRecord.distance;
            const lineMessage = {
                type: "text",
                text: "本次大約跑了" + distanceMeter + "公尺"
            };
            pushMessage(userId, lineMessage);
        }
        chatbaseService.sendMessageToChatBase(userId, address, "endLocation", "Line", "user");
    }
    else if ((yield canStartRunning(member)) === "canStartRunning" && (yield getLocationState(member)) === "sentLocation") {
        airReport(userId, latitude, longitude);
        chatbaseService.sendMessageToChatBase(userId, address, "weatherReport", "Line", "user");
        //TODO: weatherReport()
    }
    else if ((yield canStartRunning(member)) === "canStartRunning" && (yield getLocationState(member)) === "notSentLocation") {
        setLocationState(userId, 1);
        airReport(userId, latitude, longitude);
        chatbaseService.sendMessageToChatBase(userId, address, "weatherReport", "Line", "user");
        //北科大地址與經緯度
        yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.startLocation}${practiceRecord.id}:${sheetColumn_1.recordColumn.startLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]]);
        yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.startLatitude}${practiceRecord.id}:${sheetColumn_1.recordColumn.startLongtitude}${practiceRecord.id}`, [[25.0422347, 121.5385599]]);
        yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.endLocation}${practiceRecord.id}:${sheetColumn_1.recordColumn.endLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]]);
        yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.endLatitude}${practiceRecord.id}:${sheetColumn_1.recordColumn.endLongtitude}${practiceRecord.id}`, [[25.0422347, 121.5385599]]);
        const lineMessage = {
            type: "text",
            text: "附帶一提，您上次沒有傳送完整的「位置資訊」\n無法計算距離，該次紀錄不列入里程排名"
        };
        pushMessage(userId, lineMessage);
        console.log("dealing with exception");
    }
});
const updatePraticeRecord = (member, responseText) => __awaiter(this, void 0, void 0, function* () {
    const now = MomentZone().tz("Asia/Taipei");
    let practiceRecord = yield memberService.getMemberRecord(member.lineId);
    const range = `${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.endTime}${practiceRecord.id}:${sheetColumn_1.recordColumn.totalTime}${practiceRecord.id}`;
    const values = [
        [
            now.format("Y/M/D HH:mm:ss"),
            `=TEXT(IF(INDIRECT("D"&ROW())<>"",INDIRECT("D"&ROW())-INDIRECT("C"&ROW()), ""),"hh:mm:ss")`
        ]
    ];
    yield praticeService.updatePracticeRecord(range, values);
    const convertTimeRange = `${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.timeCalc}${practiceRecord.id}:${sheetColumn_1.recordColumn.timeCalc}${practiceRecord.id}`;
    const convertTimeValues = [
        [
            `=TIMEVALUE(MID(INDIRECT("${sheetColumn_1.recordColumn.totalTime}"&ROW()),1,8))`
        ]
    ];
    yield praticeService.updatePracticeRecord(convertTimeRange, convertTimeValues);
    let practiceRecordMessage = yield memberService.getMemberRecord(member.lineId);
    //console.log(practiceRecordMessage)
    const performance = yield memberService.getMemberPerformance(member.lineId);
    if ((yield getLocationState(member)) === "sentLocation") {
        const lineMessage = {
            type: "text",
            text: responseText.replace("{{runningCount}}", performance.runningCount)
                .replace("{{totalTime}}", practiceRecordMessage.totalTime)
                .replace("{{startTime}}", practiceRecordMessage.startTime)
                .replace("{{endTime}}", practiceRecordMessage.endTime)
                .replace("{{totalRunningTime}}", performance.totalRunningTime)
        };
        pushMessage(member.lineId, lineMessage);
    }
    else if ((yield getLocationState(member)) === "notSentLocation") {
        yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.startLocation}${practiceRecord.id}:${sheetColumn_1.recordColumn.startLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]]);
        yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.startLatitude}${practiceRecord.id}:${sheetColumn_1.recordColumn.startLongtitude}${practiceRecord.id}`, [[25.0422347, 121.5385599]]);
        yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.endLocation}${practiceRecord.id}:${sheetColumn_1.recordColumn.endLocation}${practiceRecord.id}`, [["106台北市大安區忠孝東路三段1號"]]);
        yield praticeService.updatePracticeRecord(`${sheetColumn_1.recordColumn.workspace}!${sheetColumn_1.recordColumn.endLatitude}${practiceRecord.id}:${sheetColumn_1.recordColumn.endLongtitude}${practiceRecord.id}`, [[25.0422347, 121.5385599]]);
        const lineMessage = {
            type: "text",
            text: responseText.replace("請傳送位置訊息，才能統計距離哦", "您沒有傳送完整的「位置資訊」\n無法計算距離，本次紀錄不列入里程排名")
                .replace("{{runningCount}}", performance.runningCount)
                .replace("{{totalTime}}", practiceRecordMessage.totalTime)
                .replace("{{startTime}}", practiceRecordMessage.startTime)
                .replace("{{endTime}}", practiceRecordMessage.endTime)
                .replace("{{totalRunningTime}}", performance.totalRunningTime)
        };
        pushMessage(member.lineId, lineMessage);
    }
});
const canStartRunning = (member) => __awaiter(this, void 0, void 0, function* () {
    if (member.workState == "1")
        return "running";
    else if (member.workState == "2")
        return "justEndRunning";
    else
        return "canStartRunning";
});
const canEndRunning = (member) => {
    return member.workState != "0";
};
const resetRunningState = (userId) => __awaiter(this, void 0, void 0, function* () {
    const member = yield memberService.getMember(userId);
    if (member.workState != "0")
        memberService.updateMemberWorkState(member, "0");
});
const setLocationState = (userId, state) => __awaiter(this, void 0, void 0, function* () {
    const member = yield memberService.getMember(userId);
    memberService.updateLocationState(member, state);
});
const getLocationState = (member) => __awaiter(this, void 0, void 0, function* () {
    if (member.locationState == 0)
        return "notSentLocation";
    else
        return "sentLocation";
});
exports.pushTextMessage = functions.https.onRequest((req, res) => {
    const message = req.body.message;
    const lineId = req.body.lineId;
    const textMessage = {
        type: "text",
        text: message
    };
    pushMessage(lineId, textMessage);
    res.sendStatus(200);
});
exports.sendPerformanceReport = functions.https.onRequest((req, res) => __awaiter(this, void 0, void 0, function* () {
    const memberPerformance = req.body;
    yield Promise.all([sendReportToGroup(memberPerformance), sendReportToMembers(memberPerformance)]);
    res.sendStatus(200);
}));
const sendReportToGroup = (data) => __awaiter(this, void 0, void 0, function* () {
    const groups = (yield groupService.getGroups()).map(group => group.groupLineId);
    //console.log(groups)
    const sorted = data.sort((a, b) => {
        if (parseInt(`${a.performance.rank}`) < parseInt(`${b.performance.rank}`))
            return -1;
        if (parseInt(`${a.performance.rank}`) > parseInt(`${b.performance.rank}`))
            return 1;
        return 0;
    });
    const now = MomentZone().tz("Asia/Taipei");
    const lineMessage = [{
            type: "text",
            text: `跑步幫手\n${now.format("M月D日")} 會員績效報表：`
        }];
    let message = "";
    for (let index = 0; index < sorted.length; index++) {
        const memberPerformance = sorted[index];
        message += `<${memberPerformance.performance.name}>\n` +
            `跑步次數：${memberPerformance.performance.runningCount}\n` +
            `跑步時間：${memberPerformance.performance.totalRunningTime}\n` +
            `時間排名：${memberPerformance.performance.rank}\n` +
            `里程總計：${memberPerformance.performance.totalRunningDist}\n` +
            `任務達成量：${memberPerformance.performance.missionCount}\n`;
        if (index % 10 === 9) {
            lineMessage.push({
                type: "text",
                text: message
            });
            message = "";
        }
        else if (index !== sorted.length - 1)
            message += "\n\n";
    }
    if (message !== "") {
        lineMessage.push({
            type: "text",
            text: message
        });
    }
    //console.log(lineMessage)
    groups.forEach(groupId => pushMessage(groupId, lineMessage));
});
const sendReportToMembers = (data) => {
    const promises = new Array();
    for (const memberPerformance of data) {
        const lineMessage = {
            type: "text",
            text: `${MomentZone().tz("Asia/Taipei").format("M月D日")} ${memberPerformance.performance.name}\n\n` +
                `跑步次數：${memberPerformance.performance.runningCount}\n：${memberPerformance.performance.runningCount}\n` +
                `跑步時間：${memberPerformance.performance.totalRunningTime}\n` +
                `時間排名：${memberPerformance.performance.rank}\n` +
                `里程總計：${memberPerformance.performance.totalRunningDist}\n` +
                `任務達成量：${memberPerformance.performance.missionCount}\n`
        };
        promises.push(pushMessage(memberPerformance.member.lineId, lineMessage));
    }
    return Promise.all(promises);
};
const pushCommandMessage = (userId) => {
    const lineMessage = {
        type: "text",
        text: `《智能跑步幫手》系統指令如下，請多利用：\n1. 查詢天氣\n2. 開始/結束跑步\n3. 查詢紀錄\n4. 任務種類`
    };
    return pushMessage(userId, lineMessage);
};
/*
const weatherReport = (userId: string, weather: WEATHER, location: string): Promise<any> =>{
    const lineMessage: TextMessage = {
        type: "text",
        text: ``
    }
    return pushMessage(userId, lineMessage)
}*/
const pushErrorMessage = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const lineMessage = {
        type: "text",
        text: result.fulfillment.messages[0].speech.replace("{{message}}", result.resolvedQuery)
    };
    pushMessage(userId, lineMessage);
});
const replyMessage = (replyToken, lineMessage) => {
    return lineClient.replyMessage(replyToken, lineMessage);
};
const pushMessage = (userId, lineMessage) => {
    if (Array.isArray(lineMessage)) {
        for (const message of lineMessage) {
            if (message.type === "text")
                chatbaseService.sendMessageToChatBase(userId, message.text, "reply", "Line", "agent");
            else
                chatbaseService.sendMessageToChatBase(userId, `This is a ${message.type} template message`, "reply", "Line", "agent");
        }
    }
    else {
        if (lineMessage.type === "text")
            chatbaseService.sendMessageToChatBase(userId, lineMessage.text, "reply", "Line", "agent");
        else
            chatbaseService.sendMessageToChatBase(userId, `This is a ${lineMessage.type} template message`, "reply", "Line", "agent");
    }
    return lineClient.pushMessage(userId, lineMessage);
};
const airReport = (userId, userLat, userLng) => __awaiter(this, void 0, void 0, function* () {
    const air = yield weatherService.getAir();
    //console.log(air)
    const unsorted = [];
    let distance = [];
    let sorted = [];
    for (let i = 0; i < air.length; i++) {
        distance[i] = (userLat - air[i].lat) * (userLat - air[i].lat) + (userLng - air[i].lng) * (userLng - air[i].lng);
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
        };
        sorted[i] = distance[i];
    }
    sorted.sort();
    console.log(sorted[0]);
    let j = 0;
    let sortedAir;
    while (true) {
        if (sorted[0] == unsorted[j].distance) {
            sortedAir = unsorted[j];
            break;
        }
        j++;
    }
    console.log(sortedAir);
    //var sortedAir = unsorted.sort((left,right) => left.distance - right.distance)
    /*
    const sortedAir = unsorted.sort((left, right) => {
        if (parseInt(`${left.distance}`) < parseInt(`${right.distance}`))
            return -1
        if (parseInt(`${left.distance}`) > parseInt(`${right.distance}`))
            return 1
        return 0
    })*/
    const lineMessage = {
        type: "text",
        text: `您附近的空氣品質：` + sortedAir["status"] + `\nPM 2.5 平均指標：` + sortedAir["pm25avg"] + `\nPM 10 平均指標：` + sortedAir["pm10avg"] + `\n資料來自最近測站 ` + sortedAir["siteName"] + `\n最後更新時間：` + sortedAir["timestamp"]
    };
    pushMessage(userId, lineMessage);
});
//# sourceMappingURL=index.js.map