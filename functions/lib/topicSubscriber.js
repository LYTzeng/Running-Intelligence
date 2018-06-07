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
const PubSub = require("@google-cloud/pubsub");
const sheetService = require("./services/sheetService");
const chatbotConfig_1 = require("./chatbotConfig");
const sheetColumn_1 = require("./sheetColumn");
const cors = require("cors")({ origin: true });
const lineClient = new bot_sdk_1.Client({
    channelSecret: chatbotConfig_1.lineConfig.channelSecret,
    channelAccessToken: chatbotConfig_1.lineConfig.channelAccessToken
});
const pubsub = PubSub();
exports.publishPostTopic = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        const postMessage = req.body;
        yield pubsub.topic("postTopic").publisher().publish(Buffer.from(JSON.stringify(postMessage)));
        res.sendStatus(200);
    }));
});
exports.postLinePushSubscriber = functions.pubsub.topic("postTopic").onPublish((data, context) => __awaiter(this, void 0, void 0, function* () {
    const chatMessage = data.json;
    const auth = yield sheetService.authorize();
    /* 讀firestore
    const allMembers = studentCollection.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                console.log(doc.id, "=>", doc.data)
            })
        })
        .catch(err => {
            console.log('Error getting document from collection "Student" Damn!', err)
        })
    */
    const memberQueryString = `Select ${sheetColumn_1.memberColumn.lineId}`;
    const memberQueryResult = yield sheetService.querySheet(auth, memberQueryString, sheetColumn_1.memberColumn.sheetId, sheetColumn_1.memberColumn.gid);
    console.log(memberQueryResult);
    for (let i = 0; memberQueryResult[i] != null; i++) {
        let lineId = memberQueryResult[i][0];
        const lineMessage = {
            type: "text",
            text: chatMessage.message
        };
        pushMessage(lineId, lineMessage);
        console.log(chatMessage.message, "已推送給使用者", lineId);
    }
}));
const pushMessage = (userId, lineMessage) => {
    return lineClient.pushMessage(userId, lineMessage);
};
//# sourceMappingURL=topicSubscriber.js.map