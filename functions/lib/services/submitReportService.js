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
exports.createSubmitRecord = (member, time) => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const values = [
        [
            member.name,
            member.studentId,
            member.department,
            time
        ]
    ];
    yield googleSheets.appendSheet(auth, sheetColumn_1.reportRecordColumn.sheetId, encodeURI(sheetColumn_1.reportRecordColumn.workspace), values);
});
//# sourceMappingURL=submitReportService.js.map