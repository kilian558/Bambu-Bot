# 🖨️ Bambu Lab Discord Bot

Ein Discord Bot, der den Status und Statistiken deines Bambu Lab 3D-Druckers in Echtzeit anzeigt. Der Bot postet automatisch Updates in einen Discord-Channel und hält die Daten immer aktuell!

## ✨ Features

- 🔄 **Automatische Live-Updates**: Status wird automatisch im Channel aktualisiert
- 📊 **Echtzeit-Status**: Zeigt den aktuellen Druckstatus (Bereit, Druckt, Pausiert, etc.)
- 🌡️ **Temperaturen**: Düse, Druckbett und Kammer-Temperaturen
- 📈 **Fortschritt**: Druckfortschritt mit verbleibender Zeit und Layer-Info
- 🎚️ **Geschwindigkeit**: Aktuelle Druckgeschwindigkeit
- 🎨 **Schöne Darstellung**: Farbcodierte Embeds mit Progress-Bar
- ⚡ **Slash Commands**: Zusätzliche Commands für detaillierte Infos

## 🚀 Installation

### 1. Discord Bot erstellen

1. Gehe zu [Discord Developer Portal](https://discord.com/developers/applications)
2. Klicke auf "New Application" und gib einen Namen ein
3. Gehe zu "Bot" → "Add Bot"
4. Kopiere den **Token** (wird später benötigt)
5. Aktiviere unter "Privileged Gateway Intents":
   - ✅ MESSAGE CONTENT INTENT
6. Gehe zu "OAuth2" → "URL Generator"
7. Wähle folgende Scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
8. Wähle folgende Bot Permissions:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
9. Kopiere die generierte URL und füge den Bot zu deinem Server hinzu

### 2. Bambu Lab Drucker vorbereiten

1. Öffne die **Bambu Handy App**
2. Gehe zu deinem Drucker
3. Tippe auf **Einstellungen** ⚙️
4. Gehe zu **Netzwerk** → **MQTT**
5. Notiere dir:
   - **Access Code** (wichtig!)
   - **Seriennummer** des Druckers
6. Stelle sicher, dass dein Drucker im gleichen Netzwerk ist
7. Notiere die **IP-Adresse** des Druckers

### 3. Discord Channel ID ermitteln

1. Aktiviere den **Developer Mode** in Discord:
   - Benutzereinstellungen → Erweitert → Entwicklermodus aktivieren
2. Rechtsklick auf den gewünschten Channel
3. Klicke auf **"Channel-ID kopieren"**
4. Notiere die ID (z.B. `1466007772809400492`)

### 4. Lokale Installation (zum Testen)

```bash
# Repository klonen
git clone <dein-repo-url>
cd Bambu-Bot

# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env
```

Bearbeite die `.env` Datei und füge deine Daten ein:

```env
DISCORD_TOKEN=dein_discord_bot_token
DISCORD_CHANNEL_ID=1466007772809400492
BAMBU_HOST=192.168.1.xxx
BAMBU_PORT=8883
BAMBU_USERNAME=bblp
BAMBU_ACCESS_CODE=dein_access_code
BAMBU_SERIAL=deine_seriennummer
```

```bash
# Bot starten
npm start
```

### 5. Deployment auf Render

1. **Repository erstellen**:
   - Pushe den Code zu GitHub/GitLab/Bitbucket

2. **Render Account**:
   - Gehe zu [render.com](https://render.com) und erstelle ein kostenloses Konto

3. **Neuen Service erstellen**:
   - Klicke auf "New +" → "Background Worker" (oder "Web Service")
   - Verbinde dein Repository
   - Wähle den Branch

4. **Umgebungsvariablen setzen**:
   - Gehe zu "Environment"
   - Füge alle Variablen aus deiner `.env` Datei hinzu:
     ```
     DISCORD_TOKEN=...
     DISCORD_CHANNEL_ID=1466007772809400492
     BAMBU_HOST=...
     BAMBU_PORT=8883
     BAMBU_USERNAME=bblp
     BAMBU_ACCESS_CODE=...
     BAMBU_SERIAL=...
     ```

5. **Deployment**:
   - Klicke auf "Create Web Service"
   - Render wird automatisch deployen

6. **Wichtig**: 
   - Stelle sicher, dass dein Drucker von außen erreichbar ist (Port-Forwarding oder VPN)
   - Oder: Verwende einen lokalen Server und verbinde Render damit

## 🎮 Bot Commands

Der Bot postet **automatisch** einen Live-Status in den konfigurierten Channel. Die Status-Message wird kontinuierlich aktualisiert (bei Änderungen sofort, mindestens alle 30 Sekunden).

Zusätzlich stehen diese Slash Commands zur Verfügung:

- `/status` - Zeigt den aktuellen Druckerstatus
- `/temperatur` - Zeigt alle Temperaturen (Düse, Bett, Kammer)
- `/fortschritt` - Zeigt detaillierten Druckfortschritt
- `/info` - Zeigt allgemeine Drucker-Informationen

## 📋 Live-Status Anzeige

Der Bot erstellt automatisch eine schöne Status-Message im konfigurierten Channel:

```
🖨️ Bambu Lab Drucker - Live Status

🔵 Druckt

📁 Aktuelle Datei
benchy.gcode

📊 Fortschritt
████████░░ 75%

🔥 Düse          🛏️ Druckbett      📦 Kammer
220°C            60°C              35°C

📏 Layer         🎚️ Geschwindigkeit  ⏱️ Verbleibend
225 / 300        100%               2h 15m

📡 Verbindung
✅ Verbunden

Letzte Aktualisierung: vor wenigen Sekunden
```

Die Message wird automatisch aktualisiert wenn:
- ✅ Sich der Druckstatus ändert
- ✅ Neue MQTT-Daten empfangen werden
- ✅ Mindestens alle 30 Sekunden (wenn verbunden)

## 📋 Beispiel Command-Ausgaben

### Status Command
```
🖨️ Bambu Lab Drucker Status
📡 Verbindung: ✅ Verbunden
📊 Status: 🔵 Druckt
📁 Datei: test_model.gcode
⏱️ Fortschritt: 42%
🎚️ Geschwindigkeit: 100%
📏 Layer: 125/300
```

### Temperatur Command
```
🌡️ Temperaturen
🔥 Düse: 220°C
🛏️ Druckbett: 60°C
📦 Kammer: 35°C
```

### Fortschritt Command
```
📈 Druckfortschritt
📁 Datei: benchy.gcode
📊 Fortschritt: ████████░░ 75%
⏱️ Verbleibende Zeit: 2h 15m
📏 Layer: 225/300
🎚️ Geschwindigkeit: 100%
```

## 🔧 Fehlerbehebung

### Bot startet nicht
- Überprüfe den Discord Token in der `.env` Datei
- Stelle sicher, dass die Channel-ID korrekt ist
- Stelle sicher, dass alle Dependencies installiert sind: `npm install`
- Prüfe, ob der Bot die Berechtigung hat, im Channel zu schreiben

### Keine Verbindung zum Drucker
- Überprüfe die IP-Adresse des Druckers
- Stelle sicher, dass der Access Code korrekt ist
- Prüfe, ob der Drucker im Netzwerk erreichbar ist
- Firewall-Einstellungen überprüfen (Port 8883)

### Commands funktionieren nicht
- Stelle sicher, dass der Bot die richtigen Berechtigungen hat
- Warte ein paar Minuten nach dem ersten Start (Commands müssen registriert werden)
- Kicke den Bot und lade ihn neu mit der OAuth2 URL ein

### Status-Message wird nicht erstellt
- Überprüfe die `DISCORD_CHANNEL_ID` in der `.env` Datei
- Stelle sicher, dass der Bot Schreibrechte im Channel hat
- Aktiviere den Developer Mode in Discord und kopiere die Channel-ID erneut
- Prüfe die Bot-Logs für Fehlermeldungen

### Status-Message wird nicht aktualisiert
- Prüfe, ob die MQTT-Verbindung zum Drucker besteht (siehe Logs)
- Stelle sicher, dass der Drucker Daten sendet (während eines Drucks)
- Die Updates erfolgen bei Änderungen + mindestens alle 30 Sekunden

### Auf Render: Drucker nicht erreichbar
Da Render in der Cloud läuft, muss dein Drucker von außen erreichbar sein:
- Option 1: Port-Forwarding in deinem Router einrichten (Port 8883)
- Option 2: VPN verwenden (z.B. Tailscale, ZeroTier)
- Option 3: Lokalen Server mit ngrok/cloudflare tunnel nutzen

## 🔒 Sicherheit

- **Teile niemals** deinen Access Code oder Discord Token!
- Füge `.env` zur `.gitignore` hinzu (bereits gemacht)
- Verwende bei Port-Forwarding sichere Passwörter

## 📝 Hinweise

- Der Bot verwendet die MQTT-Schnittstelle von Bambu Lab
- Funktioniert mit allen Bambu Lab Druckern (X1, X1C, P1P, P1S, A1, etc.)
- Kostenlos hostbar auf Render (Free Tier)
- Echtzeit-Updates über MQTT

## 🤝 Support

Bei Problemen oder Fragen:
1. Überprüfe die Logs in Render
2. Teste die Verbindung lokal
3. Stelle sicher, dass alle Umgebungsvariablen gesetzt sind

## 📜 Lizenz

MIT License - Frei verwendbar und modifizierbar!