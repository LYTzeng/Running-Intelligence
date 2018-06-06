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
exports.deleteGroup = (group) => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const range = encodeURI(`${sheetColumn_1.groupColumn.workspace}!${sheetColumn_1.groupColumn.id}${group.id}:${group.id}`);
    googleSheets.clearSheet(auth, sheetColumn_1.groupColumn.sheetId, range);
});
exports.getGroup = (groupId) => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const queryString = `select ${sheetColumn_1.groupColumn.id},` +
        `${sheetColumn_1.groupColumn.groupName},` +
        `${sheetColumn_1.groupColumn.groupLineId}` +
        ` where ${sheetColumn_1.groupColumn.groupLineId} = '${groupId}'`;
    console.log(queryString);
    const values = yield googleSheets.querySheet(auth, queryString, sheetColumn_1.groupColumn.sheetId, sheetColumn_1.groupColumn.gid);
    const group = {
        id: values[0][0],
        groupName: values[0][1],
        groupLineId: values[0][2]
    };
    return group;
});
exports.getGroups = () => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const values = yield googleSheets.readSheet(auth, sheetColumn_1.groupColumn.sheetId, encodeURI(sheetColumn_1.groupColumn.workspace));
    let groups = [];
    for (let i = 1; i < values.length; i++) {
        const groupValue = values[i];
        let group = {
            id: groupValue[0],
            groupName: groupValue[1],
            groupLineId: groupValue[2]
        };
        groups.push(group);
    }
    return groups;
});
//# sourceMappingURL=groupService.js.map