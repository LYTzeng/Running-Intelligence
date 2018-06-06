export type MEMBER = {
    id: number,
    name: string,
    weight: string,
    height: string,
    email: string,
    lineId: string,
    workState: string,
    locationState: number
}

export type GROUP = {
    id: number
    groupName: string,
    groupLineId: string
}

export type PERFORMANCE = {
    id: string,
    lineId: string,
    name: string,
    runningCount: string,
    totalRunningTime: string,
    totalRunningDist: number,
    missionCount: number,
    rank: string
}

export type RECORD = {
    id: string,
    name: string,
    startTime: string,
    endTime: string,
    totalTime: string,
    startLocation: string,
    endLocation: string,
    distance: number,
    lineId: string,
    startLatitude: number,
    startLongtitude: number,
    endLatitude: number,
    endLongtitude: number,
    timeCalc: number
}

export type MISSION_RECORD = {
    id: string,
    lineId: string,
    name: string,
    missionType: string,
    completeDate: string
}

export type MISSION_TYPE = {
    id: string,
    missionName: string,
    todo: string,
    condition: number
}

export type WEATHER = {
    siteName: string
    temp: string
    weather: string
    rain: string
    timestamp: string
}

export type STATION = {
    siteName: string
    county: string
    address: string
    lat: number
    lng: number
}

export type AIR = {
    siteName: string
    status: string
    pm25avg: number
    pm10avg: number
    lat: number
    lng: number
    timestamp: string
}

export type AIR_SORT = {
    siteName: string
    status: string
    pm25avg: number
    pm10avg: number
    lat: number
    lng: number
    timestamp: string
    distance: number
}

/*************************************/
/*      Google pub/sub framework    **/
/*************************************/
export type Member = {
    id: string
    name: string
    phone: string
    email: string
    lineId: string
    fcmToken: string
}

export type Student = {
    id: string
    studentId: string
    department: string
    performance: Performance
    member: Member
}

export type Performance = {
    id: string
    attendCount: number
    submitCount: number
    practiceCount: number
    practiceTotal: string
    practiceSum: string
    practiceRate: string
    practiceRank: number
    actionState: number
    grade: number
}

export type ChatCount = {
    postCount: number
    sendCount: number
    receiveCount: number
}

export type Admin = {
    id: string
    account: string
    member: Member
    role: string
    chatCount: ChatCount
    chatMessages?: ChatMessage[]
}

export type ChatMessage = {
    id: string
    sender: string
    receiver: string
    message: string
    timestamp: number
}

export type ChatbotEvent = {
    action: {
        name: string
        password?: string
        chatMessage?: string
        // receiver?: string
        response?: string
        lineId: string
    }
    admin?: Admin
}

export type ApplicationMessage = {
    id: string
    workflowState: string
    topicMessage: AuthorizationMessage | ActionMessage | PushMessage
}

export type AuthorizationMessage = {
    application: string
    lineId: string
    action: string
    time: string
}

export type ActionMessage = {
    application: string
    lineId: string
    action: string // Line上的命令做的事
}

export type AiSchool = {
    id: string
    authorizationMessage: AuthorizationMessage
    actionMessage: ActionMessage
}

export type PushMessage = {
    id: string
    sender: string
    receiver: string
    message: {
        type: string
        imageMapMessage?: {
            baseUrl: string
            size: {
                width: number
                height: number
            },
            actionButtons: {
                type: "message" | "uri"
                text?: string
                uri?: string
                area: {
                    x: number
                    y: number
                    width: number
                    height: number
                }
            }[]
        }
        textMessage?: {
            title?: string
            text: string
        }
        confirmMessage?: {
            text: string
            actionButtons: {
                type: "message" | "postback" | "uri"
                label: string
                text?: string
                uri?: string
                data?: string
            }[]
        }
        carouselMessage?: {
            columns: {
                imageUrl?: string
                title?: string
                text: string
                actionButtons: {
                    type: "message" | "postback" | "uri"
                    label: string
                    text?: string
                    uri?: string
                    data?: string
                }[]
            }[]
        }
    }
    channel: string
}