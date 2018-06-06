import * as chatbase from "@google/chatbase"

import { CHATBASE } from "../chatbotConfig"

export const sendMessageToChatBase = (userId: string, message: string, intent: string, platform: string, type: string, version?: string): Promise<any> => {
    if (type === "user")
        chatbase.setAsTypeUser(type)
    else if (type === "agent")
        chatbase.setAsTypeAgent(type)
    const request = chatbase.newMessage(CHATBASE.apiKey)
        .setPlatform(platform)
        .setMessage(message)
        .setVersion(version || "1.0")
        .setUserId(userId)
        .setIntent(intent)
    if (intent !== "Default Fallback Intent")
        request.setAsHandled()
    else
        request.setAsNotHandled()
    return request.send()
}