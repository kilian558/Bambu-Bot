require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const mqtt = require('mqtt');

// Discord Bot Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Bambu Lab Drucker Status
let printerStatus = {
  connected: false,
  state: 'Unbekannt',
  progress: 0,
  temperature: {
    bed: 0,
    nozzle: 0,
    chamber: 0
  },
  speed: 100,
  layer: {
    current: 0,
    total: 0
  },
  fileName: 'Keine Datei',
  remainingTime: 0,
  lastUpdate: null
};

// Status Message Tracking
let statusMessage = null;
let statusChannelId = process.env.DISCORD_CHANNEL_ID;
let lastMessageUpdate = null;

// MQTT Client Setup
let mqttClient = null;

function connectToMQTT() {
  const mqttHost = process.env.BAMBU_HOST;
  const mqttPort = process.env.BAMBU_PORT || 8883;
  const mqttUsername = process.env.BAMBU_USERNAME || 'bblp';
  const mqttPassword = process.env.BAMBU_ACCESS_CODE;
  const serialNumber = process.env.BAMBU_SERIAL;

  if (!mqttHost || !mqttPassword || !serialNumber) {
    console.error('❌ MQTT Konfiguration unvollständig. Bitte .env Datei prüfen.');
    return;
  }

  const mqttUrl = `mqtts://${mqttHost}:${mqttPort}`;
  
  mqttClient = mqtt.connect(mqttUrl, {
    username: mqttUsername,
    password: mqttPassword,
    rejectUnauthorized: false,
    reconnectPeriod: 5000
  });

  mqttClient.on('connect', () => {
    console.log('✅ Verbunden mit Bambu Lab Drucker');
    printerStatus.connected = true;
    
    // Abonniere den Report-Topic
    const topic = `device/${serialNumber}/report`;
    mqttClient.subscribe(topic, (err) => {
      if (err) {
        console.error('❌ Fehler beim Abonnieren:', err);
      } else {
        console.log(`📡 Topic abonniert: ${topic}`);
      }
    });
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      updatePrinterStatus(data);
    } catch (error) {
      console.error('Fehler beim Parsen der MQTT Nachricht:', error);
    }
  });

  mqttClient.on('error', (error) => {
    console.error('❌ MQTT Fehler:', error);
    printerStatus.connected = false;
  });

  mqttClient.on('close', () => {
    console.log('⚠️ MQTT Verbindung geschlossen');
    printerStatus.connected = false;
  });
}

function updatePrinterStatus(data) {
  printerStatus.lastUpdate = new Date();

  if (data.print) {
    // Druckstatus
    if (data.print.gcode_state) {
      printerStatus.state = getStateText(data.print.gcode_state);
    }
    if (data.print.mc_percent !== undefined) {
      printerStatus.progress = data.print.mc_percent;
    }
    if (data.print.mc_remaining_time !== undefined) {
      printerStatus.remainingTime = data.print.mc_remaining_time;
    }
    if (data.print.spd_mag !== undefined) {
      printerStatus.speed = data.print.spd_mag;
    }
    if (data.print.layer_num !== undefined) {
      printerStatus.layer.current = data.print.layer_num;
    }
    if (data.print.total_layer_num !== undefined) {
      printerStatus.layer.total = data.print.total_layer_num;
    }
    if (data.print.gcode_file) {
      printerStatus.fileName = data.print.gcode_file;
    }
    if (data.print.subtask_name) {
      printerStatus.fileName = data.print.subtask_name;
    }
  }

  // Temperaturen
  if (data.print) {
    if (data.print.bed_temper !== undefined) {
      printerStatus.temperature.bed = data.print.bed_temper;
    }
    if (data.print.nozzle_temper !== undefined) {
      printerStatus.temperature.nozzle = data.print.nozzle_temper;
    }
    if (data.print.chamber_temper !== undefined) {
      printerStatus.temperature.chamber = data.print.chamber_temper;
    }
  }

  // Update Discord Message
  updateDiscordStatusMessage();
}

function getStateText(state) {
  const states = {
    'IDLE': '🟢 Bereit',
    'RUNNING': '🔵 Druckt',
    'PAUSE': '🟡 Pausiert',
    'FINISH': '🟢 Fertig',
    'FAILED': '🔴 Fehlgeschlagen',
    'PREPARE': '🟠 Vorbereitung'
  };
  return states[state] || state;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Discord Commands
const commands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Zeigt den aktuellen Status des Druckers'),
  new SlashCommandBuilder()
    .setName('temperatur')
    .setDescription('Zeigt die aktuellen Temperaturen'),
  new SlashCommandBuilder()
    .setName('fortschritt')
    .setDescription('Zeigt den Druckfortschritt'),
  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Zeigt allgemeine Drucker-Informationen')
].map(command => command.toJSON());

// Discord Bot Events
client.once('ready', async () => {
  console.log(`✅ Discord Bot eingeloggt als ${client.user.tag}`);
  
  // Registriere Slash Commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log('🔄 Registriere Slash Commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash Commands registriert');
  } catch (error) {
    console.error('❌ Fehler beim Registrieren der Commands:', error);
  }

  // Verbinde mit MQTT
  connectToMQTT();

  // Initialisiere Status Message nach 5 Sekunden
  setTimeout(async () => {
    if (statusChannelId) {
      console.log('🔄 Erstelle initiale Status-Message...');
      await updateDiscordStatusMessage();
    }
  }, 5000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'status') {
    const embed = new EmbedBuilder()
      .setColor(printerStatus.connected ? 0x00FF00 : 0xFF0000)
      .setTitle('🖨️ Bambu Lab Drucker Status')
      .addFields(
        { name: '📡 Verbindung', value: printerStatus.connected ? '✅ Verbunden' : '❌ Getrennt', inline: true },
        { name: '📊 Status', value: printerStatus.state, inline: true },
        { name: '📁 Datei', value: printerStatus.fileName, inline: false },
        { name: '⏱️ Fortschritt', value: `${printerStatus.progress}%`, inline: true },
        { name: '🎚️ Geschwindigkeit', value: `${printerStatus.speed}%`, inline: true },
        { name: '📏 Layer', value: `${printerStatus.layer.current}/${printerStatus.layer.total}`, inline: true }
      )
      .setTimestamp(printerStatus.lastUpdate)
      .setFooter({ text: 'Letzte Aktualisierung' });

    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'temperatur') {
    const embed = new EmbedBuilder()
      .setColor(0xFF6600)
      .setTitle('🌡️ Temperaturen')
      .addFields(
        { name: '🔥 Düse', value: `${printerStatus.temperature.nozzle}°C`, inline: true },
        { name: '🛏️ Druckbett', value: `${printerStatus.temperature.bed}°C`, inline: true },
        { name: '📦 Kammer', value: `${printerStatus.temperature.chamber}°C`, inline: true }
      )
      .setTimestamp(printerStatus.lastUpdate)
      .setFooter({ text: 'Letzte Aktualisierung' });

    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'fortschritt') {
    if (printerStatus.state.includes('Druckt')) {
      const progressBar = createProgressBar(printerStatus.progress);
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📈 Druckfortschritt')
        .addFields(
          { name: '📁 Datei', value: printerStatus.fileName, inline: false },
          { name: '📊 Fortschritt', value: `${progressBar} ${printerStatus.progress}%`, inline: false },
          { name: '⏱️ Verbleibende Zeit', value: formatTime(printerStatus.remainingTime), inline: true },
          { name: '📏 Layer', value: `${printerStatus.layer.current}/${printerStatus.layer.total}`, inline: true },
          { name: '🎚️ Geschwindigkeit', value: `${printerStatus.speed}%`, inline: true }
        )
        .setTimestamp(printerStatus.lastUpdate)
        .setFooter({ text: 'Letzte Aktualisierung' });

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply('❌ Der Drucker druckt aktuell nicht.');
    }
  }

  if (commandName === 'info') {
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('ℹ️ Drucker Informationen')
      .addFields(
        { name: '🏭 Hersteller', value: 'Bambu Lab', inline: true },
        { name: '🔢 Seriennummer', value: process.env.BAMBU_SERIAL || 'N/A', inline: true },
        { name: '⏰ Bot Laufzeit', value: `${uptimeHours}h ${uptimeMinutes}m`, inline: true },
        { name: '📡 MQTT Status', value: printerStatus.connected ? '✅ Verbunden' : '❌ Getrennt', inline: true },
        { name: '🔄 Letzte Aktualisierung', value: printerStatus.lastUpdate ? printerStatus.lastUpdate.toLocaleString('de-DE') : 'Keine Daten', inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

function createProgressBar(percent) {
  const filled = Math.floor(percent / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Erstelle Status Embed
function createStatusEmbed() {
  const progressBar = createProgressBar(printerStatus.progress);
  
  // Bestimme Farbe basierend auf Status
  let color = 0x808080; // Grau für unbekannt
  if (printerStatus.state.includes('Druckt')) color = 0x0099FF; // Blau
  else if (printerStatus.state.includes('Bereit')) color = 0x00FF00; // Grün
  else if (printerStatus.state.includes('Pausiert')) color = 0xFFFF00; // Gelb
  else if (printerStatus.state.includes('Fehlgeschlagen')) color = 0xFF0000; // Rot
  else if (printerStatus.state.includes('Fertig')) color = 0x00FF00; // Grün

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🖨️ Bambu Lab Drucker - Live Status')
    .setDescription(`**${printerStatus.state}**`)
    .addFields(
      { 
        name: '📁 Aktuelle Datei', 
        value: printerStatus.fileName, 
        inline: false 
      },
      { 
        name: '📊 Fortschritt', 
        value: `${progressBar} **${printerStatus.progress}%**`, 
        inline: false 
      },
      { 
        name: '🔥 Düse', 
        value: `${printerStatus.temperature.nozzle}°C`, 
        inline: true 
      },
      { 
        name: '🛏️ Druckbett', 
        value: `${printerStatus.temperature.bed}°C`, 
        inline: true 
      },
      { 
        name: '📦 Kammer', 
        value: `${printerStatus.temperature.chamber}°C`, 
        inline: true 
      },
      { 
        name: '📏 Layer', 
        value: `${printerStatus.layer.current} / ${printerStatus.layer.total}`, 
        inline: true 
      },
      { 
        name: '🎚️ Geschwindigkeit', 
        value: `${printerStatus.speed}%`, 
        inline: true 
      },
      { 
        name: '⏱️ Verbleibend', 
        value: formatTime(printerStatus.remainingTime), 
        inline: true 
      },
      {
        name: '📡 Verbindung',
        value: printerStatus.connected ? '✅ Verbunden' : '❌ Getrennt',
        inline: false
      }
    )
    .setTimestamp(printerStatus.lastUpdate || new Date())
    .setFooter({ text: 'Letzte Aktualisierung' });

  return embed;
}

// Update Discord Status Message
async function updateDiscordStatusMessage() {
  // Throttle updates (max 1 Update alle 5 Sekunden)
  const now = Date.now();
  if (lastMessageUpdate && (now - lastMessageUpdate) < 5000) {
    return;
  }
  lastMessageUpdate = now;

  try {
    if (!statusChannelId) {
      console.log('⚠️ Keine Discord Channel-ID konfiguriert. Setze DISCORD_CHANNEL_ID in .env');
      return;
    }

    const channel = await client.channels.fetch(statusChannelId);
    if (!channel) {
      console.error('❌ Channel nicht gefunden!');
      return;
    }

    const embed = createStatusEmbed();

    if (statusMessage) {
      // Update existierende Message
      try {
        await statusMessage.edit({ embeds: [embed] });
      } catch (error) {
        // Falls Message gelöscht wurde, erstelle neue
        console.log('⚠️ Alte Message nicht gefunden, erstelle neue...');
        statusMessage = await channel.send({ embeds: [embed] });
      }
    } else {
      // Erstelle neue Message
      statusMessage = await channel.send({ embeds: [embed] });
      console.log('✅ Status-Message erstellt');
    }
  } catch (error) {
    console.error('❌ Fehler beim Update der Discord Message:', error);
  }
}

// Periodisches Update (alle 30 Sekunden)
setInterval(() => {
  if (printerStatus.connected && statusMessage) {
    updateDiscordStatusMessage();
  }
}, 30000);

// Fehlerbehandlung
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

// Bot starten
client.login(process.env.DISCORD_TOKEN);
