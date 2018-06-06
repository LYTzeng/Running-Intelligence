"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const chatBot = require("./chatBot");
/* The webhook of the chatbot */
exports.webhook = chatBot.webhook;
exports.pushTextMessage = chatBot.pushTextMessage;
exports.sendPerformanceReport = chatBot.sendPerformanceReport;
//# sourceMappingURL=index.js.map