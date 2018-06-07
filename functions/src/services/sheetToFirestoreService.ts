import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import axios from "axios"
const cors = require("cors")({ origin: true })

import { Member, Performance, User, Admin } from "../firestoreModel"

const firestore = admin.firestore()
const adminCollection = firestore.collection("Admin")
const userCollection = firestore.collection("User")


export const sheetToFirestoreUser = functions.https.onRequest(async (req, res) => {
    console.log(JSON.stringify(req.body, null, 4))
    const lineId = req.body.lineId as string
    const user = req.body.user as User
    await userCollection.doc(lineId).update({ ...user })
        .catch(() => userCollection.doc(lineId).set({ ...user }))
    res.sendStatus(200)
})

export const sheetToFirestoreMember = functions.https.onRequest(async (req, res) => {
    console.log(JSON.stringify(req.body, null, 4))
    const lineId = req.body.lineId as string
    const member = req.body.member as Member
    await userCollection.doc(lineId).update({ member })
        .catch(() => userCollection.doc(lineId).set({ member }))
    res.sendStatus(200)
})

export const sheetToFirestorePerformance = functions.https.onRequest(async (req, res) => {
    console.log(JSON.stringify(req.body, null, 4))
    const lineId = req.body.lineId as string
    const performance = req.body.performance as Performance
    await userCollection.doc(lineId).update({ performance })
        .catch(() => userCollection.doc(lineId).set({ performance }))
    res.sendStatus(200)
})

export const sheetToFirestoreAdmin = functions.https.onRequest(async (req, res) => {
    const admin = req.body as Admin
    console.log(JSON.stringify(admin, null, 4))

    const adminSnapshot = await adminCollection.where("member.email", "==", admin.member.email).get()
    if (!adminSnapshot.empty) {
        const adminReference = adminSnapshot.docs[0].ref
        await adminReference.update(admin)
    } else {
        await adminCollection.doc(admin.account).set(admin)
    }
    res.sendStatus(200)
})

