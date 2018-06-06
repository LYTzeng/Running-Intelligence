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
const NodeCache = require("node-cache");
const bot_sdk_1 = require("@line/bot-sdk");
const chatbotConfig_1 = require("./chatbotConfig");
const client = new bot_sdk_1.Client(chatbotConfig_1.LINE);
const chatbotCache = new NodeCache({ checkperiod: 0 });
exports.webhook = functions.https.onRequest((req, res) => {
    const signature = req.headers["x-line-signature"];
    if (bot_sdk_1.validateSignature(JSON.stringify(req.body), chatbotConfig_1.LINE.channelSecret, signature)) {
        const events = req.body.events;
        events.forEach((event) => __awaiter(this, void 0, void 0, function* () {
            console.log(JSON.stringify(event, null, 4));
            eventDispatcher(event);
        }));
    }
    res.sendStatus(200);
});
const eventDispatcher = (event) => {
    const userId = event.source.userId;
    switch (event.type) {
        case "message":
            if (event.message.type == "text") {
                const intent = event.message.text;
                messageDispatcher(userId, event.replyToken, intent);
            }
            break;
    }
};
const messageDispatcher = (userId, replyToken, intent) => {
    switch (intent) {
        case "上課簽到":
            attendClass(userId);
            break;
        case "實習開始":
            beginPractice(userId);
            break;
        case "實習結束":
            endPractice(userId);
            break;
        case "繳交報告":
            submittedReport(userId);
            break;
        default:
            replyErrorMessage(userId, replyToken, intent);
            break;
    }
};
const attendClass = (userId) => {
    const attendRecord = chatbotCache.get(userId + "AttendRecord");
    const now = new Date();
    const newAttendRecord = { timeStamp: now.getTime() };
    if (attendRecord) {
        attendRecord.push(newAttendRecord);
        chatbotCache.set(userId + "AttendRecord", attendRecord);
    }
    else
        chatbotCache.set(userId + "AttendRecord", [newAttendRecord]);
    const attendTime = now.toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei" });
    const attendCount = attendRecord ? attendRecord.length : 1;
    const lineMessage = {
        type: "text",
        text: `簽到成功\n\n簽到時間：${attendTime}\n簽到次數：${attendCount}`
    };
    pushMessage(userId, lineMessage);
};
const beginPractice = (userId) => {
    const practiceRecord = chatbotCache.get(userId + "PracticeRecord");
    const now = new Date();
    const newPracticeRecord = {
        state: 1,
        beginTime: now.getTime(),
        endTime: null,
        practiceTime: null,
        remindCounter: 0
    };
    if (practiceRecord) {
        practiceRecord.push(newPracticeRecord);
        chatbotCache.set(userId + "PracticeRecord", practiceRecord);
    }
    else
        chatbotCache.set(userId + "PracticeRecord", [newPracticeRecord]);
    const beginTime = now.toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei" });
    const lineMessage = {
        type: "text",
        text: `實習開始\n\n開始時間：${beginTime}`
    };
    pushMessage(userId, lineMessage);
};
const endPractice = (userId) => {
    let practiceRecord = chatbotCache.get(userId + "PracticeRecord");
    updatePraticeRecord(userId);
};
const submittedReport = (userId) => {
    let reportRecord = chatbotCache.get(userId + "ReportRecord");
    const now = new Date();
    const newReportRecord = { timeStamp: now.getTime() };
    if (reportRecord) {
        reportRecord.push(newReportRecord);
        chatbotCache.set(userId + "ReportRecord", reportRecord);
    }
    else
        chatbotCache.set(userId + "ReportRecord", [newReportRecord]);
    const submitTime = now.toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei" });
    const submitCount = reportRecord ? reportRecord.length : 1;
    const lineMessage = {
        type: "text",
        text: `繳交報告\n\n繳交時間：${submitTime}\n繳交次數：${submitCount}`
    };
    pushMessage(userId, lineMessage);
};
const updatePraticeRecord = (userId) => {
    let practiceRecord = chatbotCache.get(userId + "PracticeRecord");
    const now = new Date();
    const beginTime = practiceRecord[practiceRecord.length - 1].beginTime;
    practiceRecord[practiceRecord.length - 1].state = 0;
    practiceRecord[practiceRecord.length - 1].endTime = now.getTime();
    practiceRecord[practiceRecord.length - 1].practiceTime = now.getTime() - beginTime;
    chatbotCache.set(userId + "PracticeRecord", practiceRecord);
    let totalPracticeTime = 0;
    for (const record of practiceRecord) {
        if (record.state === 0)
            totalPracticeTime += record.practiceTime;
    }
    const lineMessage = {
        type: "text",
        text: `實習結束\n\n` +
            `實習次數：${practiceRecord.length}\n\n` +
            `開始時間：${new Date(beginTime).toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei" })}\n` +
            `結束時間：${now.toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei" })}\n\n` +
            `本次實習：${calculateDuration(now.getTime() - beginTime)}\n` +
            `累計時間：${calculateDuration(totalPracticeTime)}`
    };
    pushMessage(userId, lineMessage);
};
const calculateDuration = (duration) => {
    const hours = Math.floor(duration / (60 * 60 * 1000));
    const minutes = Math.floor((duration - hours * (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((duration - hours * (60 * 60 * 1000) - minutes * (60 * 1000)) / 1000);
    return `${hours}:${minutes}:${seconds}`;
};
const pushCommandMessage = (userId) => {
    const lineMessage = {
        type: "text",
        text: `《智能學堂》系統指令如下，請多利用：\n1. 上課簽到\n2. 實習開始\n3. 實習結束\n4. 繳交報告`
    };
    return pushMessage(userId, lineMessage);
};
const replyEchoMessage = (replyToken, message) => {
    const lineMessage = {
        type: "text",
        text: message
    };
    replyMessage(replyToken, lineMessage);
};
const replyErrorMessage = (userId, replyToken, message) => __awaiter(this, void 0, void 0, function* () {
    const lineMessage = {
        type: "text",
        text: `你所說的.....\n${message}\n不是智能學堂的指令`
    };
    yield replyMessage(replyToken, lineMessage);
    return pushCommandMessage(userId);
});
const pushMessage = (userId, lineMessage) => {
    return client.pushMessage(userId, lineMessage);
};
const replyMessage = (replyToken, lineMessage) => {
    return client.replyMessage(replyToken, lineMessage);
};
//# sourceMappingURL=index-1.js.map