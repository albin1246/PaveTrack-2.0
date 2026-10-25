# PaveTrack 2.0 – säkerhetsuppdatering 1

## Ändringar
- Systemägaren kan inte längre lista alla medlemskonton i ett företags underkollektion. Systemägaren kan fortfarande läsa enskilda medlemskonton enligt tidigare regler för att administrera företag.
- Nya jobb kräver serverbaserade createdAt/updatedAt och att ownerName motsvarar det egna medlemskontots namn.
- Uppdaterade jobb kräver serverbaserad updatedAt.
- Jobb kräver giltiga tidsstämplar samt begränsad längd på ownerName.
- Övrig appkod, design och tidigare jobb har inte ändrats.

## Publicering
1. Öppna Firebase Console > Firestore Database > Rules för projektet pavetrack-f60e1.
2. Säkerhetskopiera nuvarande regler.
3. Ersätt med innehållet i firestore.rules och klicka Publish.
4. Testa registrering, jobbskapande, redigering, historik, godkännande av företag och användarhantering.
5. Vid problem återställ de säkerhetskopierade reglerna.

GitHub Pages använder inte firestore.rules automatiskt. Att ladda upp ZIP-filen på GitHub publicerar inte reglerna.

## Begränsningar
Detta är en konservativ härdning, inte en fullständig säkerhetscertifiering. Kontrollera med Firebase Emulator Suite före produktionslansering. Befintliga företagsdata har inte ändrats.
