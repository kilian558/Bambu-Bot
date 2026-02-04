# Bambu Discord Bot - PM2 Deployment Guide

## 📋 Voraussetzungen

- Linux Server (Ubuntu/Debian empfohlen)
- Node.js 18.x oder höher
- npm
- PM2 (wird automatisch installiert)

## 🚀 Schnellstart

### 1. Repository auf Server übertragen

```bash
# Via Git
git clone <dein-repository-url>
cd Bambu-Bot

# Oder via SCP/SFTP die Dateien hochladen
```

### 2. Setup-Script ausführbar machen

```bash
chmod +x setup-pm2.sh
```

### 3. Setup-Script ausführen

```bash
./setup-pm2.sh
```

Das Script wird:
- Node.js und npm Versionen prüfen
- Dependencies installieren
- PM2 installieren (falls nicht vorhanden)
- .env Datei erstellen (falls nicht vorhanden)
- Logs-Ordner erstellen
- Optional den Bot starten

### 4. .env Datei konfigurieren

Falls noch nicht geschehen, bearbeite die `.env` Datei:

```bash
nano .env
```

Fülle alle erforderlichen Werte aus:
- `DISCORD_TOKEN` - Dein Discord Bot Token
- `DISCORD_CHANNEL_ID` - Discord Channel ID für Status-Updates
- `BAMBU_HOST` - IP-Adresse deines Bambu Lab Druckers
- `BAMBU_ACCESS_CODE` - Access Code aus der Bambu App
- `BAMBU_SERIAL` - Seriennummer deines Druckers

## 🔧 PM2 Befehle

### NPM Scripts (empfohlen)

```bash
npm run pm2:start      # Bot starten
npm run pm2:stop       # Bot stoppen
npm run pm2:restart    # Bot neustarten
npm run pm2:logs       # Logs anzeigen
npm run pm2:status     # Status anzeigen
npm run pm2:delete     # Bot aus PM2 entfernen
```

### Direkte PM2 Befehle

```bash
pm2 start ecosystem.config.js       # Bot starten
pm2 stop bambu-discord-bot          # Bot stoppen
pm2 restart bambu-discord-bot       # Bot neustarten
pm2 logs bambu-discord-bot          # Logs anzeigen
pm2 logs bambu-discord-bot --lines 100  # Letzte 100 Zeilen
pm2 monit                           # Monitoring Dashboard
pm2 status                          # Status aller Prozesse
pm2 delete bambu-discord-bot        # Bot entfernen
```

## 🔄 Autostart beim Booten

Um den Bot automatisch beim Server-Start zu starten:

```bash
# PM2 Startup Script generieren
pm2 startup

# Führe den angezeigten Befehl aus (mit sudo)
# Beispiel: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# Aktuelle PM2 Prozesse speichern
pm2 save
```

Jetzt startet der Bot automatisch nach einem Server-Neustart!

### Autostart deaktivieren

```bash
pm2 unstartup
pm2 save --force
```

## 📊 Monitoring

### Live-Logs verfolgen

```bash
pm2 logs bambu-discord-bot
```

### Monitoring Dashboard

```bash
pm2 monit
```

### Log-Dateien

Die Logs werden gespeichert in:
- `logs/out.log` - Standard Output
- `logs/err.log` - Fehler
- `logs/combined.log` - Kombinierte Logs

```bash
# Logs ansehen
tail -f logs/combined.log
tail -f logs/err.log

# Logs löschen
pm2 flush
```

## 🔧 Erweiterte Konfiguration

Die PM2-Konfiguration befindet sich in `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'bambu-discord-bot',
    script: './bot.js',
    instances: 1,                  // Anzahl Instanzen
    autorestart: true,             // Auto-Restart bei Crash
    max_memory_restart: '500M',    // Restart bei zu viel RAM
    min_uptime: '10s',             // Mindest-Laufzeit
    max_restarts: 10,              // Max Restarts in kurzer Zeit
    restart_delay: 5000,           // Verzögerung zwischen Restarts
    // ...weitere Optionen
  }]
};
```

## 🐛 Fehlerbehebung

### Bot startet nicht

```bash
# Prüfe Logs
pm2 logs bambu-discord-bot --err

# Prüfe .env Datei
cat .env

# Teste manuell
node bot.js
```

### Port 8883 geblockt

```bash
# Firewall-Regel hinzufügen (UFW)
sudo ufw allow 8883/tcp

# Oder iptables
sudo iptables -A OUTPUT -p tcp --dport 8883 -j ACCEPT
```

### MQTT Verbindungsfehler

1. Prüfe ob Drucker erreichbar ist: `ping <drucker-ip>`
2. Prüfe Access Code in Bambu App
3. Prüfe ob Port 8883 offen ist: `telnet <drucker-ip> 8883`

### Hohe CPU/RAM-Nutzung

```bash
# Ressourcen-Nutzung anzeigen
pm2 monit

# Prozess neu starten
pm2 restart bambu-discord-bot
```

## 📦 Updates

```bash
# Bot stoppen
pm2 stop bambu-discord-bot

# Updates herunterladen (wenn via Git)
git pull

# Dependencies aktualisieren
npm install

# Bot neu starten
pm2 restart bambu-discord-bot
```

## 🔐 Sicherheit

1. **Niemals** die `.env` Datei teilen oder committen
2. Beschränke Zugriff auf den Server
3. Halte Node.js und PM2 aktuell
4. Verwende einen non-root User für PM2

```bash
# PM2 als non-root User starten
sudo -u username pm2 start ecosystem.config.js
```

## 📝 Systemd Service (Alternative zu PM2 Startup)

Falls du lieber einen systemd Service verwenden möchtest:

```bash
sudo nano /etc/systemd/system/bambu-bot.service
```

```ini
[Unit]
Description=Bambu Discord Bot
After=network.target

[Service]
Type=simple
User=dein-username
WorkingDirectory=/pfad/zum/bot
ExecStart=/usr/bin/node /pfad/zum/bot/bot.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable bambu-bot
sudo systemctl start bambu-bot
sudo systemctl status bambu-bot
```

## 💡 Tipps

- Verwende `pm2 monit` für Live-Überwachung
- Setze `pm2 save` nach Änderungen
- Prüfe regelmäßig `pm2 logs` auf Fehler
- Verwende `pm2 reset` um Statistiken zurückzusetzen
- Backup der `.env` Datei erstellen

## 📞 Support

Bei Problemen:
1. Prüfe Logs: `pm2 logs bambu-discord-bot`
2. Prüfe Status: `pm2 status`
3. Teste manuell: `node bot.js`
4. Prüfe .env Datei auf Fehler
