# PaveTrack – registrering och återställning

## Vad ändrades?
- Inbjudningskoden kontrolleras innan ett nytt Auth-konto skapas.
- Firestore-profil och företagsmedlemskap sparas i samma batch.
- Inloggade anställda vars Auth-konto saknar Firestore-profil får ett formulär för att slutföra anslutningen med inbjudningskod.
- Befintliga användarprofiler i andra företag skrivs inte över.

## Installation
1. Publicera uppdaterade webbplatsfiler från ZIP-filen till GitHub Pages.
2. Behåll nuvarande Firestore-regler; ingen regeländring ingår.
3. Be den berörda anställde logga in med sitt befintliga konto och fylla i MALARDALEN på sidan för väntande konto.
4. Kontrollera att användaren syns som pending under Företagsadmin och godkänn.

## Viktigt
Registreringsfelet kan även bero på ett regelvillkor i den aktiva Firebase-miljön. Om anslutningen nekas visar formuläret nu det faktiska felet. Den här versionen är inte testad mot den aktiva databasen.
