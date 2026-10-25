# PaveTrack – arkivering och permanent radering

## Arkivera och återaktivera
Ladda upp webb-filerna till GitHub Pages som tidigare. Arkivera använder samma Firestore-status `paused` som den gamla Pausa-knappen, så inga nya regler krävs. Arkiverade företag kan återaktiveras. Inloggning i Firebase Auth kan fortfarande lyckas, men appen blockerar företagets arbetsvy och Firestore-reglerna blockerar jobbåtkomst.

## Permanent radering – kräver serverinstallation
**OBS: Knappen fungerar inte förrän Cloud Function är driftsatt.** Radering kan inte utföras säkert enbart via GitHub Pages. Du behöver Firebase-projektets Blaze-plan (för Cloud Functions), Firebase CLI och rättigheter att driftsätta funktioner.

1. Säkerhetskopiera Firestore och kontrollera att du verkligen vill kunna radera all historik. Se även tillämpliga regler för lagring/radering.
2. Installera Node.js 22 och Firebase CLI: `npm install -g firebase-tools`.
3. Öppna en terminal i den uppackade mappen. Kör `firebase login` och `firebase use pavetrack-f60e1`.
4. Kör `cd functions && npm install && cd ..`.
5. Kör `firebase deploy --only functions:deleteCompanyPermanently`.
6. Kontrollera funktionen i Firebase Console, logga in som systemägare och testa först med ett påhittat företag utan viktiga data.

Funktionen verifierar systemägarens UID på servern, kräver exakt företagsnamn, pausar företaget, tar bort företagets dokument och underdokument, därefter användarnas rotprofiler och Firebase Auth-konton. Raderingen är **inte atomär**: om ett fel inträffar halvvägs kan man behöva städa kvarvarande data manuellt. Ha alltid backup.

**Viktigt:** Uppdatera inte Firestore-regler för att tillåta klientradering. `allow delete: if false` ska behållas. Publicera inte `functions`-mappen som en del av webbplatsen om du kan undvika det; den används för serverdistribution.
