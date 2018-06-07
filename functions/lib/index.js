"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const chatBot = require("./chatBot");
const sheetToFirestoreServices = require("./services/sheetToFirestoreService");
const authService = require("./services/authService");
const pubsub = require("./topicSubscriber");
/* The webhook of the chatbot */
exports.webhook = chatBot.webhook;
exports.pushTextMessage = chatBot.pushTextMessage;
exports.sendPerformanceReport = chatBot.sendPerformanceReport;
/* 一個 Webhook 用來把 Sheet 的資料丟到 Firestore */
exports.sheetToFirestoreUser = sheetToFirestoreServices.sheetToFirestoreUser;
exports.sheetToFirestoreMember = sheetToFirestoreServices.sheetToFirestoreMember;
exports.sheetToFirestoreAdmin = sheetToFirestoreServices.sheetToFirestoreAdmin;
exports.sheetToFirestorePerformance = sheetToFirestoreServices.sheetToFirestorePerformance;
/* Firestore 的 Admin 和 Firebase Auth 互通 */
exports.firestoreToAuthentication = authService.firestoreToAuthentication;
exports.authenticationToFirestore = authService.authenticationToFirestore;
exports.firestoreToAuthenticationDelete = authService.firestoreToAuthenticationDelete;
/* Pub/Sub */
exports.publishPostTopic = pubsub.publishPostTopic;
exports.postLinePushSubscriber = pubsub.postLinePushSubscriber;
//# sourceMappingURL=index.js.map