import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { Admin } from "../firestoreModel"

const auth = admin.auth()
const firestore = admin.firestore()
const adminCollection = firestore.collection("Admin")

export const firestoreToAuthentication = functions.firestore.document("Admin/{account}").onCreate((snapshot, context) => {
    const admin = snapshot.data() as Admin
    return auth.createUser({
        uid: admin.account,
        email: admin.member.email,
        password: admin.password,
        displayName: admin.member.name
    })
})

export const authenticationToFirestore = functions.auth.user().onDelete(user => {
    return adminCollection.doc(user.uid).delete()
})

export const firestoreToAuthenticationDelete = functions.firestore.document("Admin/{account}").onDelete((snapshot, context) => {
    const admin = snapshot.data() as Admin
    return auth.deleteUser(admin.account)
})