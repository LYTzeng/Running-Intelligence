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
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const firestore = admin.firestore();
const adminCollection = firestore.collection("Admin");
const userCollection = firestore.collection("User");
exports.sheetToFirestoreUser = functions.https.onRequest((req, res) => __awaiter(this, void 0, void 0, function* () {
    console.log(JSON.stringify(req.body, null, 4));
    const lineId = req.body.lineId;
    const user = req.body.user;
    yield userCollection.doc(lineId).update(Object.assign({}, user))
        .catch(() => userCollection.doc(lineId).set(Object.assign({}, user)));
    res.sendStatus(200);
}));
exports.sheetToFirestoreMember = functions.https.onRequest((req, res) => __awaiter(this, void 0, void 0, function* () {
    console.log(JSON.stringify(req.body, null, 4));
    const lineId = req.body.lineId;
    const member = req.body.member;
    yield userCollection.doc(lineId).update({ member })
        .catch(() => userCollection.doc(lineId).set({ member }));
    res.sendStatus(200);
}));
exports.sheetToFirestorePerformance = functions.https.onRequest((req, res) => __awaiter(this, void 0, void 0, function* () {
    console.log(JSON.stringify(req.body, null, 4));
    const lineId = req.body.lineId;
    const performance = req.body.performance;
    yield userCollection.doc(lineId).update({ performance })
        .catch(() => userCollection.doc(lineId).set({ performance }));
    res.sendStatus(200);
}));
exports.sheetToFirestoreAdmin = functions.https.onRequest((req, res) => __awaiter(this, void 0, void 0, function* () {
    const admin = req.body;
    console.log(JSON.stringify(admin, null, 4));
    const adminSnapshot = yield adminCollection.where("member.email", "==", admin.member.email).get();
    if (!adminSnapshot.empty) {
        const adminReference = adminSnapshot.docs[0].ref;
        yield adminReference.update(admin);
    }
    else {
        yield adminCollection.doc(admin.account).set(admin);
    }
    res.sendStatus(200);
}));
//# sourceMappingURL=sheetToFirestoreService.js.map