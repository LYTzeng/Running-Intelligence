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
exports.getAir = () => __awaiter(this, void 0, void 0, function* () {
    const auth = yield googleSheets.authorize();
    const values = yield googleSheets.readSheet(auth, sheetColumn_1.airColumn.sheetId, encodeURI(sheetColumn_1.airColumn.workspace));
    //console.log(values)
    let air = [];
    for (let i = 1; i < values.length; i++) {
        const airValue = values[i];
        let data = {
            siteName: airValue[0],
            status: airValue[1],
            pm25avg: airValue[2],
            pm10avg: airValue[3],
            lat: airValue[4],
            lng: airValue[5],
            timestamp: airValue[6]
        };
        air.push(data);
    }
    return air;
});
//# sourceMappingURL=weatherService.js.map