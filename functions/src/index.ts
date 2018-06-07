import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

admin.initializeApp(functions.config().firebase)

import * as chatBot from "./chatBot"
import * as sheetToFirestoreServices from "./services/sheetToFirestoreService"
import * as authService from "./services/authService"
import * as pubsub from "./topicSubscriber"

/* The webhook of the chatbot */
export const webhook = chatBot.webhook
export const pushTextMessage = chatBot.pushTextMessage
export const sendPerformanceReport = chatBot.sendPerformanceReport

/* 一個 Webhook 用來把 Sheet 的資料丟到 Firestore */
export const sheetToFirestoreUser = sheetToFirestoreServices.sheetToFirestoreUser
export const sheetToFirestoreMember = sheetToFirestoreServices.sheetToFirestoreMember
export const sheetToFirestoreAdmin = sheetToFirestoreServices.sheetToFirestoreAdmin
export const sheetToFirestorePerformance = sheetToFirestoreServices.sheetToFirestorePerformance

/* Firestore 的 Admin 和 Firebase Auth 互通 */
export const firestoreToAuthentication = authService.firestoreToAuthentication
export const authenticationToFirestore = authService.authenticationToFirestore
export const firestoreToAuthenticationDelete = authService.firestoreToAuthenticationDelete

/* Pub/Sub */
export const publishPostTopic = pubsub.publishPostTopic
export const postLinePushSubscriber = pubsub.postLinePushSubscriber
