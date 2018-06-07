export type Member = {
    id: string
    name: string
    email: string
    lineId: string
}

export type User = {
    id: string
    lineId: string
    performance: Performance
    member: Member
}

export type Admin = {
    id: string
    account: string
    password: string
    member: Member
    role: string
    chatCount: ChatCount
    chatMessages?: ChatMessage[]
}

export type Performance = {
    id: string,
    lineId: string,
    name: string,
    runningCount: string,
    totalRunningTime: string,
    totalRunningDist: number,
    rank: string
}

export type ChatCount = {
    postCount: number
    sendCount: number
    receiveCount: number
}

export type ChatMessage = {
    id: string
    sender: string
    receiver: string
    message: string
    timestamp: number
}
