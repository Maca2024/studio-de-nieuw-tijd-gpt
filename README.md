# Studio Nieuwe Tijd Chatbot

Een AI-chatbot die toegang heeft tot de wijsheid uit alle Studio Nieuwe Tijd podcast afleveringen.

## Vereisten

Je hebt een **Google Gemini API key** nodig. Je kunt deze gratis verkrijgen op:
https://aistudio.google.com/app/apikey

## Installatie

1. Kopieer `.env.example` naar `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` en voeg je API key toe:
   ```
   VITE_API_KEY=jouw_api_key_hier
   ```

3. Installeer dependencies (indien nog niet gedaan):
   ```bash
   npm install
   ```

## Gebruik

Start de development server:
```bash
npm run dev
```

De applicatie is dan beschikbaar op http://localhost:3000/

## Probleem oplossen

Als het scherm volledig zwart blijft:
- Controleer of je `.env` bestand exists en de correcte API key bevat
- Herstart de dev server na het toevoegen van de API key (Ctrl+C, dan opnieuw `npm run dev`)
