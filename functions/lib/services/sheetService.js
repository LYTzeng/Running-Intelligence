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
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const axios_1 = require("axios");
const chatbotConfig_1 = require("../chatbotConfig");
exports.authorize = () => {
    return new Promise(resolve => {
        const secret = chatbotConfig_1.sheetClientSecret.installed.client_secret;
        const clientId = chatbotConfig_1.sheetClientSecret.installed.client_id;
        const redirectUrl = chatbotConfig_1.sheetClientSecret.installed.redirect_uris[0];
        const oauth2Client = new google_auth_library_1.OAuth2Client(clientId, secret, redirectUrl);
        oauth2Client.setCredentials({
            access_token: chatbotConfig_1.sheetToken.access_token,
            refresh_token: chatbotConfig_1.sheetToken.refresh_token
        });
        resolve(oauth2Client);
    });
};
exports.readSheet = (auth, spreadsheetId, range) => {
    return new Promise((resolve, reject) => {
        const sheets = googleapis_1.google.sheets("v4");
        sheets.spreadsheets.values.get({
            auth: auth,
            spreadsheetId: spreadsheetId,
            range: range
        }, (error, result) => {
            //if (error) {
            //console.log("The API returned an error: ", error)
            //  reject(error)
            //} else
            resolve(result.data.values);
        });
    });
};
exports.appendSheet = (auth, spreadsheetId, range, values) => {
    return new Promise((resolve, reject) => {
        const sheets = googleapis_1.google.sheets("v4");
        sheets.spreadsheets.values.append({
            auth: auth,
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: "USER_ENTERED",
            resource: { values: values }
        }, (error, result) => {
            //if (error) {
            //console.log(error)
            //reject(error)
            //} else {
            console.log("%d cells appended.", result.data.updates.updatedCells);
            resolve(result);
            //}
        });
    });
};
exports.writeSheet = (auth, spreadsheetId, range, values) => {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const sheets = googleapis_1.google.sheets("v4");
        const body = { values: values };
        sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: "USER_ENTERED",
            resource: body,
            auth: auth
        }, (error, result) => {
            //if (error) {
            //console.log("The API returned an error: ", error)
            //reject(error)
            //} else {
            console.log("%d cells updated. ", result.data.updatedCells);
            console.log("%s 欄位被更新", range);
            console.log(values);
            resolve(result);
            //}
        });
    }));
};
exports.clearSheet = (auth, spreadsheetId, range) => {
    return new Promise((resolve, reject) => {
        const sheets = googleapis_1.google.sheets("v4");
        sheets.spreadsheets.values.clear({
            spreadsheetId: spreadsheetId,
            range: range,
            auth: auth
        }, (error, result) => {
            if (error) {
                console.log("The API returned an error: ", error);
                reject(error);
            }
            else {
                console.log("%d cells clear. ", 1);
                resolve(result);
            }
        });
    });
};
exports.querySheet = (auth, queryString, sheetId, gid) => {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const reg = /google.visualization.Query.setResponse\((.*)\)/g;
        const query = encodeURI(queryString);
        const url = `https://spreadsheets.google.com/tq?tqx=out:json&tq=${query}&key=${sheetId}&gid=${gid}`;
        const token = yield auth.refreshAccessToken();
        const headers = {
            "Authorization": "Bearer " + token.credentials.access_token
        };
        //console.log("URL : " + url)
        axios_1.default.get(url, { headers }).then(result => {
            const data = JSON.parse(reg.exec(result.data)[1]).table.rows;
            //console.log(data)
            const formats = [];
            data.forEach(col => {
                const format = [];
                col.c.forEach(row => {
                    if (row) {
                        if (typeof row.v === "string") {
                            if (row.v.includes("Date")) {
                                format.push(row.f);
                                return;
                            }
                        }
                        if (typeof row.v === "number") {
                            if (row.f.includes("%")) {
                                format.push(row.f);
                                return;
                            }
                        }
                        if (Array.isArray(row.v)) {
                            format.push(row.f);
                            return;
                        }
                        format.push(row.v);
                        return;
                    }
                    format.push(null);
                });
                formats.push(format);
            });
            resolve(formats);
        }); //.catch(error => reject(error))
    }));
};
//# sourceMappingURL=sheetService.js.map