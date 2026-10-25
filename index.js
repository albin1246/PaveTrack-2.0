"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore}=require("firebase-admin/firestore");
const {getAuth}=require("firebase-admin/auth");
initializeApp();
const OWNER_UID="lxZFcIJuSaPAzN6dgx7hSLo5PW22";
exports.deleteCompanyPermanently=onCall({region:"europe-west1",maxInstances:2,timeoutSeconds:540,memory:"1GiB"},async(request)=>{
 if(!request.auth||request.auth.uid!==OWNER_UID)throw new HttpsError("permission-denied","Endast systemägaren får radera företag.");
 const {companyId,confirmName}=request.data||{};
 if(typeof companyId!=="string"||!companyId||companyId.includes("/")||companyId===OWNER_UID||typeof confirmName!=="string")throw new HttpsError("invalid-argument","Ogiltigt företag.");
 const db=getFirestore(),companyRef=db.doc(`companies/${companyId}`);
 const snap=await companyRef.get();
 if(!snap.exists)throw new HttpsError("not-found","Företaget finns inte.");
 if(snap.data().name!==confirmName)throw new HttpsError("failed-precondition","Företagsnamnet matchar inte.");
 // Block new work before deleting. A failed deletion leaves the company paused.
 await companyRef.update({status:"paused"});
 const members=await companyRef.collection("users").get();
 const uids=[...new Set([snap.data().founderUid,...members.docs.map(d=>d.id)].filter(Boolean))];
 if(uids.includes(OWNER_UID))throw new HttpsError("failed-precondition","Systemägarens konto får inte raderas.");
 // Delete all nested data (including jobs, teams, and memberships) server-side.
 await db.recursiveDelete(companyRef);
 for(const uid of uids){
   const root=db.doc(`users/${uid}`);const rootSnap=await root.get();
   if(rootSnap.exists&&rootSnap.data().companyId===companyId)await root.delete();
   try{await getAuth().deleteUser(uid)}catch(err){if(err.code!=="auth/user-not-found")throw err;}
 }
 return {deleted:true};
});
