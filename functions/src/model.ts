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

/* Google Pub/Sub */
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