#!/bin/bash

# Bambu Discord Bot - PM2 Setup Script für Linux
# ==============================================

echo "🚀 Bambu Discord Bot - PM2 Setup"
echo "================================="
echo ""

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Prüfe ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js ist nicht installiert!${NC}"
    echo "Installiere Node.js mit:"
    echo "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs"
    exit 1
fi

echo -e "${GREEN}✅ Node.js gefunden: $(node -v)${NC}"

# Prüfe ob npm installiert ist
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm ist nicht installiert!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm gefunden: $(npm -v)${NC}"
echo ""

# Installiere Dependencies
echo "📦 Installiere Node.js Pakete..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Fehler beim Installieren der Pakete${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pakete installiert${NC}"
echo ""

# Prüfe ob PM2 global installiert ist
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 ist nicht global installiert${NC}"
    echo "Installiere PM2 global..."
    sudo npm install -g pm2
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Fehler beim Installieren von PM2${NC}"
        echo "Versuche es manuell mit: sudo npm install -g pm2"
        exit 1
    fi
fi

echo -e "${GREEN}✅ PM2 gefunden: $(pm2 -v)${NC}"
echo ""

# Prüfe ob .env Datei existiert
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env Datei nicht gefunden${NC}"
    if [ -f .env.example ]; then
        echo "Kopiere .env.example zu .env..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Bitte bearbeite die .env Datei mit deinen Zugangsdaten!${NC}"
        echo "nano .env"
        exit 0
    else
        echo -e "${RED}❌ Keine .env.example Datei gefunden${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ .env Datei gefunden${NC}"
echo ""

# Erstelle logs Verzeichnis
mkdir -p logs
echo -e "${GREEN}✅ Logs Verzeichnis erstellt${NC}"
echo ""

# Zeige PM2 Status
echo "📊 Aktueller PM2 Status:"
pm2 list
echo ""

# Frage ob Bot gestartet werden soll
read -p "Möchtest du den Bot jetzt mit PM2 starten? (j/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[JjYy]$ ]]; then
    echo "🚀 Starte Bot mit PM2..."
    pm2 start ecosystem.config.js
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Bot erfolgreich gestartet!${NC}"
        echo ""
        echo "📋 Nützliche PM2 Befehle:"
        echo "  npm run pm2:status   - Status anzeigen"
        echo "  npm run pm2:logs     - Logs anzeigen"
        echo "  npm run pm2:restart  - Bot neustarten"
        echo "  npm run pm2:stop     - Bot stoppen"
        echo "  npm run pm2:delete   - Bot aus PM2 entfernen"
        echo ""
        echo "  pm2 save            - Aktuelle Prozesse speichern"
        echo "  pm2 startup         - Autostart beim Booten einrichten"
        echo ""
        
        # Zeige Logs
        echo "📝 Zeige Logs (Beenden mit Ctrl+C)..."
        sleep 2
        pm2 logs bambu-discord-bot --lines 50
    else
        echo -e "${RED}❌ Fehler beim Starten des Bots${NC}"
        exit 1
    fi
else
    echo ""
    echo "ℹ️  Bot wurde nicht gestartet."
    echo "Starte den Bot später mit: npm run pm2:start"
fi
