import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

admin.initializeApp(functions.config().firebase)

import * as chatBot from "./chatBot"

/* The webhook of the chatbot */
export const webhook = chatBot.webhook
export const pushTextMessage = chatBot.pushTextMessage
export const sendPerformanceReport = chatBot.sendPerformanceReport
