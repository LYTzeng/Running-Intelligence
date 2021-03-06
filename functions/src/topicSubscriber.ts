import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import {Client, Message, TextMessage} from '@line/bot-sdk'
import * as PubSub from "@google-cloud/pubsub"
import * as uuid from 'uuid'

import * as sheetService from "./services/sheetService"
import { lineConfig } from './chatbotConfig'
import { ChatMessage } from './model'
import { Admin } from './firestoreModel'
import { memberColumn } from './sheetColumn'


const cors = require("cors")({ origin: true })

const lineClient = new Client({
    channelSecret: lineConfig.channelSecret,
    channelAccessToken: lineConfig.channelAccessToken
})

const pubsub = PubSub()

const firestore = admin.firestore()
const adminCollection = firestore.collection("Admin")
const postCollection = firestore.collection("Post")

export const publishPostTopic = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const postMessage: ChatMessage = req.body
        await pubsub.topic("postTopic").publisher().publish(Buffer.from(JSON.stringify(postMessage)))
        res.sendStatus(200)
    })
})

/* 把公告訊息塞到Firestore */
export const postMessageSubscriber = functions.pubsub.topic("postTopic").onPublish(async (data, context) => {
    const message: ChatMessage = { id: uuid.v4(), ...data.json, timestamp: new Date().getTime() }
    const senderReference = await adminCollection.doc(message.sender)

    return Promise.all([
        postCollection.doc(message.id).create(message),
        firestore.runTransaction(async transaction => {
            const senderDocument = await transaction.get(senderReference)
            const sender = senderDocument.data() as Admin
            const senderChatCount = sender.chatCount || { postCount: 0, sendCount: 0, receiveCount: 0 }
            return transaction.update(senderReference, { chatCount: { ...senderChatCount, postCount: senderChatCount.postCount + 1 } })
        })
    ])
})

/* 把公告訊息推給所有LINE用戶 */
export const postLinePushSubscriber = functions.pubsub.topic("postTopic").onPublish(async (data, context) => {
    const chatMessage: ChatMessage = data.json

    const auth = await sheetService.authorize()

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

    const memberQueryString = `Select ${memberColumn.lineId}`
    const memberQueryResult = await sheetService.querySheet(auth, memberQueryString, memberColumn.sheetId, memberColumn.gid) as Array<any>
    console.log(memberQueryResult)    
    for(let i = 0; memberQueryResult[i] != null;i++){
        let lineId = memberQueryResult[i][0]
        const lineMessage: TextMessage = {
            type: "text",
            text: chatMessage.message
        }
        pushMessage(lineId, lineMessage)
        console.log(chatMessage.message, "已推送給使用者", lineId)
    }
})

const pushMessage = (userId: string, lineMessage: Message | Array<Message>): Promise<any> => {
    return lineClient.pushMessage(userId, lineMessage)
}

export const getLatestPost = async () => {
    const postList = postCollection.get().then(snap => {snap.forEach(doc => {console.log(doc.data())})})
    return postList
    //const message: ChatMessage = 
}