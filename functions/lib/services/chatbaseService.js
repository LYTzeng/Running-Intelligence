"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatbase = require("@google/chatbase");
const chatbotConfig_1 = require("../chatbotConfig");
exports.sendMessageToChatBase = (userId, message, intent, platform, type, version) => {
    if (type === "user")
        chatbase.setAsTypeUser(type);
    else if (type === "agent")
        chatbase.setAsTypeAgent(type);
    const request = chatbase.newMessage(chatbotConfig_1.CHATBASE.apiKey)
        .setPlatform(platform)
        .setMessage(message)
        .setVersion(version || "1.0")
        .setUserId(userId)
        .setIntent(intent);
    if (intent !== "Default Fallback Intent")
        request.setAsHandled();
    else
        request.setAsNotHandled();
    return request.send();
};
//# sourceMappingURL=chatbaseService.js.map