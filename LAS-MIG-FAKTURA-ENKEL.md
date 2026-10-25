# PaveTrack 2.2 – enkel fakturastatus

**Orsak:** Den tidigare uppdateringsregeln kontrollerade alla obligatoriska jobbfält. Äldre jobb kan sakna dem och nekas därför även vid en enkel fakturamarkering.

**Ändring:** En separat `allow update` för faktureringsstatus som endast kräver att inloggad användare är admin/superadmin i samma godkända företag. Endast `invoiced`, `invoicedAt`, `invoicedBy`, `updatedAt`, `updatedBy` får ändras. Äldre jobbfält behöver inte valideras i denna operation. Övriga jobbuppdateringar följer fortfarande tidigare regler.

## Installation
1. Firebase Console → Firestore Database → Rules.
2. Ersätt reglerna med innehållet i `firestore.rules` och välj Publish.
3. Uppdatera PaveTrack och prova att bocka i ett gammalt jobb.

Ingen ändring i webbappen behövs: nuvarande `app.js` skickar redan rätt fält med `serverTimestamp()`.

**Obs:** Säkerhetsreglerna har granskats statiskt, inte testats mot ditt Firebase-projekt. Om fel kvarstår måste admin-medlemskap, publicerade regler eller jobbsamlingens sökväg kontrolleras.
