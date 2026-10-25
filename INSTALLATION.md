# PaveTrack 2.0 – Arbetslag och säkerhet (testversion)

Firebase-projekt: `pavetrack-f60e1`. Originalappen ska inte ändras.

## Nytt
- Registrering av företag och personal med atomär Firestore-batch.
- Systemägaren godkänner företag och grundaren i en gemensam batch.
- Företagets administratör skapar arbetslag under Användare.
- Varje godkänd användare kan välja Mitt arbetslag. Vid nytt jobb väljs arbetslag (frivilligt), sparas på jobbet och syns i historik/CSV.
- Firestore-regler med tenant-separation och ingen åtkomst för plattformsägaren till jobb.
- Betalning förblir en administrativ inställning, ingen faktisk debitering.

## VIKTIGT innan publicering
1. Behåll originalappen och dess Firebase-projekt orörda.
2. Granska `firestore.rules` och testa med Firebase Emulator Suite innan Publish.
3. Testa ny företagsregistrering, användare, arbetslag, jobb och åtkomst mellan två företag med olika konton.
4. Kontrollera Authentication > Settings > Authorized domains för ny GitHub Pages-adress.
5. Denna ZIP är inte en verifierad produktionsrelease: Emulator-tester har inte körts här.
6. Konton skapade tidigare i det nya projektet utan profildokument kan behöva återställas manuellt.

## Betalningar
Gratisläge gäller som standard. Att ändra `billingEnabled` innebär inte att betalning sker eller att åtkomst spärras; betalningsintegration och serverkontroller måste utvecklas innan lansering.


Ny version: originalbilden av Vögele 1303 används i sidhuvudet och appikonerna. Ingen Firebase-ändring krävs. Ladda upp filerna i GitHub-repositoryts rot, ersätt befintliga filer och uppdatera webbläsaren med Ctrl+F5.
