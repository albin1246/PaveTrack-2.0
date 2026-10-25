# Arbetsläge för systemägaren

Systemägaren kan växla mellan **Systemägare** och **Mitt arbete** med samma inloggning. Arbetsläget använder ENDAST det företag som finns i systemägarens egen profil (`users/{uid}.companyId`).

## Förutsättningar

- Systemägaren måste ha ett root-profildokument `users/{uid}` med `companyId`.
- Motsvarande `companies/{companyId}/users/{uid}` måste finnas och vara `approved`.
- Företaget måste ha status `approved`.
- Då visas växlingsknapparna automatiskt. Utan dessa förutsättningar visas enbart systemägarpanelen.

Ingen annan företagsdata läses i arbetsläget. Inga Firestore-regler behöver ändras för växlingen. Systemägaren får inte automatiskt rätt att läsa andra företags arbetsrapporter.

Om ditt systemägarkonto inte redan är medlem i ett företag måste medlemskapet ordnas separat, på ett säkert sätt. Den här versionen skapar inte medlemskap automatiskt och kringgår inte Firebase-regler.

Ladda upp webbappens filer till GitHub Pages på samma sätt som tidigare.
