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
const attendClassService = require("./services/attendClassService");
const submitReportService = require("./services/submitReportService");
const praticeService = require("./services/praticeService");
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
            if (event.message.type === "text")
                messageDispatcher(userId, event.message.text);
            break;
        default:
            break;
    }
};
const replyFollowMessage = (replyToken, userId) => __awaiter(this, void 0, void 0, function* () {
    const lineMessage = {
        type: "text",
        text: "歡迎加入智能學堂，\n研究《智能對話技術》與《雲端平台技術》之整合"
    };
    yield replyMessage(replyToken, lineMessage);
    setDialogflowEvent(userId, "askForName");
});
const unfollow = (userId) => __awaiter(this, void 0, void 0, function* () {
    const member = yield memberService.getMember(userId);
    memberService.deleteMember(member);
});
const replyJoinMessage = (replyToken, groupId) => {
    const url = `https://docs.google.com/forms/d/e/1FAIpQLSd6_4pL6hy9lb5UPSe2lEItQINdVwW4MLOLkuDYygrhC8nWBg/viewform?usp=pp_url&entry.929266669=${groupId}`;
    const lineMessage = {
        type: "text",
        text: `我是《智能學堂》\n很高興受邀加入貴群組【${groupId}】\n\n請你填表幫我長智慧，讓我知道這個群組的相關資料`
    };
    const buttonsMessage = {
        type: "template",
        altText: "This is a buttons template",
        template: {
            type: "buttons",
            title: "智能學堂",
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
    request.on("response", response => actionDispatcher(userId, response.result)).end();
    request.on("error", error => console.log("Error: ", error));
};
const setDialogflowEvent = (userId, eventName, eventParameter) => __awaiter(this, void 0, void 0, function* () {
    const request = dialogflowAgent.eventRequest({
        name: eventName,
        data: eventParameter
    }, { sessionId: userId });
    request.on("response", response => actionDispatcher(userId, response.result)).end();
    request.on("error", error => console.log("Error: ", error));
});
const actionDispatcher = (userId, result) => {
    console.log(JSON.stringify(result, null, 4));
    const action = result.action;
    switch (action) {
        case "register.askForRegister":
            askForRegister(userId, result);
            break;
        case "attendClass":
            attendClass(userId, result);
            break;
        case "beginPractice":
            beginPractice(userId, result);
            break;
        case "endPractice":
            endPractice(userId, result);
            break;
        case "requestReport":
            requestReport(userId, result);
            break;
        case "submittedReport":
            submittedReport(userId, result);
            break;
        case "notSubmittedReport":
            notSubmittedReport(userId, result);
            break;
        default:
            pushErrorMessage(userId, result);
            break;
    }
};
const askForRegister = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const name = result.parameters.name;
    const member = yield memberService.getMemberByName(name);
    console.log(member);
    let url = "https://docs.google.com/forms/d/e/1FAIpQLSfv9CDQw5cl8HfbYYPh4BlSCioFC-RBX2HmxbWn3Mv-SFftbw/viewform?usp=pp_url";
    if (member)
        url += `&entry.1895829370=${member.name}&entry.1769730236=${member.studentId}&entry.1657012764=${member.phone}&entry.1551598639=${member.email}&entry.65040739=${member.department}&entry.451116393=${userId}`;
    else
        url += `&entry.1895829370=${name}&entry.451116393=${userId}`;
    const lineMessage = {
        type: "template",
        altText: "This is a buttons template",
        template: {
            type: "buttons",
            title: "智能學堂 學員註冊",
            text: "請填寫學員資料",
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
const attendClass = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const responseText = result.fulfillment.messages[0].speech;
    const parameters = result.parameters;
    if (parameters.class !== "" && parameters.attend) {
        const member = yield memberService.getMember(userId);
        const now = MomentZone().tz("Asia/Taipei");
        yield attendClassService.createAttendRecord(member, now.format("Y/M/D HH:mm"));
        const performance = yield memberService.getMemberPerformance(member.name);
        memberService.updateMemberAttendState(member, "1");
        const lineMessage = {
            type: "text",
            text: responseText.replace("{{attendTime}}", now.format("Y/M/D HH:mm"))
                .replace("{{attendCount}}", performance.attendCount)
        };
        pushMessage(userId, lineMessage);
    }
    else
        pushErrorMessage(userId, result);
});
const beginPractice = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const responseText = result.fulfillment.messages[0].speech;
    const parameters = result.parameters;
    if (parameters.practice !== "" && parameters.begin !== "") {
        const member = yield memberService.getMember(userId);
        memberService.updateMemberWorkState(member, "1");
        const now = MomentZone().tz("Asia/Taipei");
        yield praticeService.createPracticeRecord(member, now.format("Y/M/D HH:mm"));
        const lineMessage = {
            type: "text",
            text: responseText.replace("{{beginTime}}", now.format("Y/M/D HH:mm"))
        };
        pushMessage(userId, lineMessage);
    }
    else
        pushErrorMessage(userId, result);
});
const endPractice = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const parameters = result.parameters;
    if (parameters.practice !== "" && parameters.end !== "") {
        const member = yield memberService.getMember(userId);
        const responseText = result.fulfillment.messages[0].speech;
        updatePraticeRecord(member, responseText);
    }
    else
        pushErrorMessage(userId, result);
});
const updatePraticeRecord = (member, responseText) => __awaiter(this, void 0, void 0, function* () {
    memberService.updateMemberWorkState(member, "0");
    const now = MomentZone().tz("Asia/Taipei");
    let practiceRecord = yield memberService.getMemberPracticeRecord(member.name);
    const range = `${sheetColumn_1.practiceRecordColumn.workspace}!${sheetColumn_1.practiceRecordColumn.endTime}${practiceRecord.id}:${sheetColumn_1.practiceRecordColumn.practiceTime}${practiceRecord.id}`;
    const values = [
        [
            now.format("Y/M/D HH:mm"),
            `=IF(INDIRECT("F"&ROW())<>"",INDIRECT("F"&ROW())-INDIRECT("E"&ROW()), "")`
        ]
    ];
    yield praticeService.updatePracticeRecord(range, values);
    practiceRecord = yield memberService.getMemberPracticeRecord(member.name);
    console.log(practiceRecord);
    const performance = yield memberService.getMemberPerformance(member.name);
    const lineMessage = {
        type: "text",
        text: responseText.replace("{{practiceCount}}", performance.practiceCount)
            .replace("{{beginTime}}", practiceRecord.beginTime)
            .replace("{{endTime}}", practiceRecord.endTime)
            .replace("{{practiceTime}}", practiceRecord.practiceTime)
            .replace("{{totalPracticeTime}}", performance.totalPracticeTime)
    };
    pushMessage(member.lineId, lineMessage);
});
const requestReport = (userId, result) => {
    const responseText = result.fulfillment.messages[0].speech;
    const parameters = result.parameters;
    if (parameters.report !== "" && parameters.submit !== "") {
        const lineMessage = {
            type: "text",
            text: responseText
        };
        const confirmMessage = {
            type: "template",
            altText: "this is a confirm template",
            template: {
                type: "confirm",
                text: "上傳完畢？",
                actions: [
                    {
                        type: "message",
                        label: "是",
                        text: "是"
                    },
                    {
                        type: "message",
                        label: "否",
                        text: "否"
                    }
                ]
            }
        };
        pushMessage(userId, [lineMessage, confirmMessage]);
    }
    else
        pushErrorMessage(userId, result);
};
const submittedReport = (userId, result) => __awaiter(this, void 0, void 0, function* () {
    const parameters = result.parameters;
    if (parameters.report !== "" && parameters.submit !== "") {
        const member = yield memberService.getMember(userId);
        const now = MomentZone().tz("Asia/Taipei");
        const responseText = result.fulfillment.messages[0].speech;
        yield submitReportService.createSubmitRecord(member, now.format("Y/M/D HH:mm"));
        const performance = yield memberService.getMemberPerformance(member.name);
        const lineMessage = {
            type: "text",
            text: responseText.replace("{{submitTime}}", now.format("Y/M/D HH:mm"))
                .replace("{{submitCount}}", performance.submitCount)
        };
        pushMessage(userId, lineMessage);
    }
    else
        pushErrorMessage(userId, result);
});
const notSubmittedReport = (userId, result) => {
    const lineMessage = {
        type: "text",
        text: result.fulfillment.messages[0].speech
    };
    pushMessage(userId, lineMessage);
};
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
    console.log(groups);
    const sorted = data.sort((a, b) => {
        if (parseInt(`${a.performance.practiceRank}`) < parseInt(`${b.performance.practiceRank}`))
            return -1;
        if (parseInt(`${a.performance.practiceRank}`) > parseInt(`${b.performance.practiceRank}`))
            return 1;
        return 0;
    });
    const now = MomentZone().tz("Asia/Taipei");
    const lineMessage = [{
            type: "text",
            text: `智能學堂\n${now.format("M月D日")} 學員績效報表：`
        }];
    let message = "";
    for (let index = 0; index < sorted.length; index++) {
        const memberPerformance = sorted[index];
        message += `<${memberPerformance.performance.name}>\n` +
            `實習次數：${memberPerformance.performance.practiceCount}\n` +
            `實習時間：${memberPerformance.performance.totalPracticeTime}\n` +
            `投入比例：${memberPerformance.performance.practiceRate}\n` +
            `績效排名：${memberPerformance.performance.practiceRank}`;
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
    console.log(lineMessage);
    groups.forEach(groupId => pushMessage(groupId, lineMessage));
});
const sendReportToMembers = (data) => {
    const promises = new Array();
    for (const memberPerformance of data) {
        const lineMessage = {
            type: "text",
            text: `${MomentZone().tz("Asia/Taipei").format("M月D日")} ${memberPerformance.performance.name}\n\n` +
                `出席次數：${memberPerformance.performance.attendCount}\n\n` +
                `繳交次數：${memberPerformance.performance.submitCount}\n\n` +
                `實習次數：${memberPerformance.performance.practiceCount}\n` +
                `累計實習：${memberPerformance.performance.totalPracticeTime}\n` +
                `全體時數：${memberPerformance.performance.practiceAll}\n` +
                `投入比例：${memberPerformance.performance.practiceRate}\n` +
                `全體排名：${memberPerformance.performance.practiceRank}`
        };
        promises.push(pushMessage(memberPerformance.member.lineId, lineMessage));
    }
    return Promise.all(promises);
};
const pushCommandMessage = (userId) => {
    const lineMessage = {
        type: "text",
        text: `《智能學堂》系統指令如下，請多利用：\n1. 上課簽到\n2. 實習開始\n3. 實習結束\n4. 繳交報告`
    };
    return pushMessage(userId, lineMessage);
};
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
    return lineClient.pushMessage(userId, lineMessage);
};
//# sourceMappingURL=index0.js.map