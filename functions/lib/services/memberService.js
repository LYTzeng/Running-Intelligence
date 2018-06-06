"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const googleSheets = require("../services/sheetService");
const sheetColumn_1 = require("../sheetColumn");
const sheetColumn_2 = require("../sheetColumn");
//import { google, GoogleApis } from "googleapis";
exports.getMember = (userId) => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const queryString = `select ${sheetColumn_1.memberColumn.id},` +
        `${sheetColumn_1.memberColumn.name},` +
        `${sheetColumn_1.memberColumn.weight},` +
        `${sheetColumn_1.memberColumn.height},` +
        `${sheetColumn_1.memberColumn.email},` +
        `${sheetColumn_1.memberColumn.lineId},` +
        `${sheetColumn_1.memberColumn.workState}` +
        ` where ${sheetColumn_1.memberColumn.lineId} = '${userId}'`;
    const values = yield googleSheets.querySheet(auth, queryString, sheetColumn_1.memberColumn.sheetId, sheetColumn_1.memberColumn.gid);
    const member = {
        id: values[0][0],
        name: values[0][1],
        weight: values[0][2],
        height: values[0][3],
        email: values[0][4],
        lineId: values[0][5],
        workState: values[0][6]
    };
    return member;
});
exports.getMemberByName = (name) => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const queryString = `select ${sheetColumn_1.memberColumn.id},${sheetColumn_1.memberColumn.name},${sheetColumn_1.memberColumn.weight},${sheetColumn_1.memberColumn.height},${sheetColumn_1.memberColumn.email},${sheetColumn_1.memberColumn.lineId},${sheetColumn_1.memberColumn.workState} where ${sheetColumn_1.memberColumn.name} = '${name}'`;
    const values = yield googleSheets.querySheet(auth, queryString, sheetColumn_1.memberColumn.sheetId, sheetColumn_1.memberColumn.gid);
    //console.log(values)
    if (values.length) {
        const member = {
            id: values[0][0],
            name: values[0][1],
            weight: values[0][2],
            height: values[0][3],
            email: values[0][4],
            lineId: values[0][5],
            workState: values[0][6]
        };
        //console.log(member)
        return member;
    }
    return null;
});
exports.getMemberPerformance = (lineId) => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const queryString = `select ${sheetColumn_2.performanceColumn.id},` +
        `${sheetColumn_2.performanceColumn.lineId},` +
        `${sheetColumn_2.performanceColumn.name},` +
        `${sheetColumn_2.performanceColumn.runningCount},` +
        `${sheetColumn_2.performanceColumn.totalRunningTime},` +
        `${sheetColumn_2.performanceColumn.totalRunningDist},` +
        `${sheetColumn_2.performanceColumn.missionCount},` +
        `${sheetColumn_2.performanceColumn.rank}` +
        ` where ${sheetColumn_2.performanceColumn.lineId} = '${lineId}'`;
    //console.log(queryString)
    const values = yield googleSheets.querySheet(auth, queryString, sheetColumn_2.performanceColumn.sheetId, sheetColumn_2.performanceColumn.gid);
    const performance = {
        id: values[0][0],
        lineId: values[0][1],
        name: values[0][2],
        runningCount: values[0][3],
        totalRunningTime: values[0][4],
        totalRunningDist: values[0][5],
        missionCount: values[0][6],
        rank: values[0][7]
    };
    return performance;
});
exports.getMemberRecord = (lineId) => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const queryString = `select ${sheetColumn_2.recordColumn.id},` +
        `${sheetColumn_2.recordColumn.name},` +
        `${sheetColumn_2.recordColumn.startTime},` +
        `${sheetColumn_2.recordColumn.endTime},` +
        `${sheetColumn_2.recordColumn.totalTime},` +
        `${sheetColumn_2.recordColumn.startLocation},` +
        `${sheetColumn_2.recordColumn.endLocation},` +
        `${sheetColumn_2.recordColumn.distance},` +
        `${sheetColumn_2.recordColumn.lineId},` +
        `${sheetColumn_2.recordColumn.startLatitude},` +
        `${sheetColumn_2.recordColumn.startLongtitude},` +
        `${sheetColumn_2.recordColumn.endLatitude},` +
        `${sheetColumn_2.recordColumn.endLongtitude},` +
        `${sheetColumn_2.recordColumn.timeCalc}` +
        ` where ${sheetColumn_2.recordColumn.lineId} = '${lineId}' order by ${sheetColumn_2.recordColumn.id} DESC limit 1`;
    const values = yield googleSheets.querySheet(auth, queryString, sheetColumn_2.recordColumn.sheetId, sheetColumn_2.recordColumn.gid);
    //console.log(values)
    const record = {
        id: values[0][0],
        name: values[0][1],
        startTime: values[0][2],
        endTime: values[0][3],
        totalTime: values[0][4],
        startLocation: values[0][5],
        endLocation: values[0][6],
        distance: values[0][7],
        lineId: values[0][8],
        startLatitude: values[0][9],
        startLongtitude: values[0][10],
        endLatitude: values[0][11],
        endLongtitude: values[0][12],
        timeCalc: values[0][13]
    };
    return record;
});
/*
export const getWeather = async (location: string) => {
    const auth = await googleSheets.authorize()
    const queryString = `select${weatherColumn.siteName},${weatherColumn.temp},${weatherColumn.rain},${weatherColumn.weather} where ${weatherColumn.siteName}=${location}`
    const values = await googleSheets.querySheet(auth, queryString, recordColumn.sheetId, recordColumn.gid)
    console.log(values)
    const weather = {
        siteName: values[0][0],
        temp: values[0][1],
        rain: values[0][2],
        weather: values[0][3]
    } as WEATHER
    return weather
}*/
exports.updateMemberWorkState = (member, workState) => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const range = encodeURI(`${sheetColumn_1.memberColumn.workspace}!${sheetColumn_1.memberColumn.workState}${member.id}:${sheetColumn_1.memberColumn.workState}${member.id}`);
    googleSheets.writeSheet(auth, sheetColumn_1.memberColumn.sheetId, range, [[workState]]);
});
exports.updateLocationState = (member, state) => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const range = encodeURI(`${sheetColumn_1.memberColumn.workspace}!${sheetColumn_1.memberColumn.locationState}${member.id}:${sheetColumn_1.memberColumn.locationState}${member.id}`);
    googleSheets.writeSheet(auth, sheetColumn_1.memberColumn.sheetId, range, [[state]]);
});
exports.deleteMember = (member) => __awaiter(this, void 0, void 0, function* () {
    //console.log(member)
    const auth = yield googleSheets.authorize();
    let range = encodeURI(`${sheetColumn_1.memberColumn.workspace}!${sheetColumn_1.memberColumn.lineId}${member.id}:${sheetColumn_1.memberColumn.lineId}${member.id}`);
    googleSheets.clearSheet(auth, sheetColumn_1.memberColumn.sheetId, range);
});
//# sourceMappingURL=memberService.js.map