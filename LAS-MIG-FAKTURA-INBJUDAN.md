# PaveTrack 2.2 – fakturering och inbjudningskod

1. Publicera innehållet i `firestore.rules` i Firebase Console > Firestore Database > Rules > Publish.
2. Webbappens filer är samma som i föregående paket; inga nya webbändringar krävs för denna regelkorrigering.
3. Logga in som superadmin, gå till Användare och klicka **Bjud in anställd**. Detta ska skapa `/inviteCodes/MALARDALEN`.
4. Kontrollera i Firestore Data att dokumentet `/inviteCodes/MALARDALEN` finns och har `companyId` lika med `lxZFcIJuSaPAzN6dgx7hSLo5PW22`.
5. Om det inte skapas: dokument-ID `MALARDALEN`, fälten `companyId` (string) = `lxZFcIJuSaPAzN6dgx7hSLo5PW22`, `createdBy` (string) = `lxZFcIJuSaPAzN6dgx7hSLo5PW22`, `createdAt` (timestamp) = nuvarande tid. Skapa bara manuellt om koden inte används av något annat företag.

OBS: Jag kan inte kontrollera den aktiva Firestore-databasen härifrån. Testa gärna med ett nytt jobb och en testanställd.
