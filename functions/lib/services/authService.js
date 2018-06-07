"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const auth = admin.auth();
const firestore = admin.firestore();
const adminCollection = firestore.collection("Admin");
exports.firestoreToAuthentication = functions.firestore.document("Admin/{account}").onCreate((snapshot, context) => {
    const admin = snapshot.data();
    return auth.createUser({
        uid: admin.account,
        email: admin.member.email,
        password: admin.password,
        displayName: admin.member.name
    });
});
exports.authenticationToFirestore = functions.auth.user().onDelete(user => {
    return adminCollection.doc(user.uid).delete();
});
exports.firestoreToAuthenticationDelete = functions.firestore.document("Admin/{account}").onDelete((snapshot, context) => {
    const admin = snapshot.data();
    return auth.deleteUser(admin.account);
});
//# sourceMappingURL=authService.js.map