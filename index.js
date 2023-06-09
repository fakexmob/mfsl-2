const { greenBright, blackBright, red, green, whiteBright } = require('chalk');
const { Client } = require('discord.js-selfbot-v13');
const path = require('path');
const fs = require('fs');

const client = new Client({
  checkUpdate: false,
});

const homeDir = require('os').homedir();
const tokenFilePath = path.join(homeDir, 'Downloads', 'Millennials-sf', 'token.txt');

let tokens = [];

if (fs.existsSync(tokenFilePath)) {
  tokens = fs.readFileSync(tokenFilePath, 'utf8').split('\n').filter(Boolean);
} else {
  console.error(red('Token file not found:', tokenFilePath));
  return;
}

const invalidTokens = [];
const validTokens = [];

async function checkTokens() {
  if (tokens.length === 0) {
    console.log('No tokens found in the token file.');
    return;
  }

  const delay = 3000; // Delay in milliseconds

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const client = new Client({
      checkUpdate: false,
    });

    try {
      await client.login(token);
      validTokens.push(token);
      client.destroy();
    } catch (error) {
      invalidTokens.push(token);
    }

    if (i !== tokens.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Print the results
  console.log('Valid Tokens:');
  console.log(validTokens);
  console.log('Invalid Tokens:');
  console.log(invalidTokens);

  // Delete invalid tokens from the token file
  if (invalidTokens.length > 0) {
    const updatedTokens = tokens.filter((token) => !invalidTokens.includes(token));

    fs.writeFileSync(tokenFilePath, updatedTokens.join('\n'));
    console.log('Invalid tokens have been deleted from the token file.');
  }

  if (validTokens.length > 0) {
    const client = new Client({
      checkUpdate: false,
    });

    client.on('ready', () => {
      console.clear();
      const watermark = path.join(__dirname, 'Util', 'Watermark.txt');

      fs.readFile(watermark, 'utf8', (err, data) => {
        if (err) {
          console.error(red('Error reading the watermark art file:', err));
          return;
        }

        console.log(data);
        console.log(greenBright('[+] Online!'));
        console.log(green('Logged in with token:') + ' ' + whiteBright(validTokens[0]));
        console.log(blackBright('-----------'));
      });
    });

    client.login(validTokens[0]);
  } else {
    console.log('No valid tokens found to login with.');
  }
}

checkTokens();

// 🔼 Token 🔼 Token 🔼 Token 🔼 Token 🔼 Token 🔼 Token 🔼 Token 🔼 Token 🔼
// 🔽 Commands 🔽 Commands 🔽 Commands 🔽 Commands 🔽 Commands 🔽 Commands 🔽 

const logDir = path.join(homeDir, 'Millennials-sf', 'Logs');
const messagesLimit = 5;
let messagesCount = 0;
const sentUsers = new Set();
const messageCache = new Map();

client.on('messageCreate', async (msg) => {
  let autoMessage = '**Hi!, This is an automatic message.** Every message will be logged';

  if (msg.guild === null && msg.author.id !== client.user.id) {
    console.log(blackBright('[?] Detected a message in DMs'));
    if (!sentUsers.has(msg.author.id)) {
      await msg.channel.send(autoMessage);
      console.log(greenBright('[+] Sent a message.'));
      sentUsers.add(msg.author.id);
    }

    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
        console.log(green('[+] Created the log folder:', logDir));
      } catch (err) {
        console.log(redBright('[-] Failed to create log directory:', err));
        return;
      }
    }

    const fileName = `${msg.author.username} - ${msg.author.id}.txt`;
    const timestamp = new Date().toLocaleString();
    console.log(greenBright('[+] Logged a message:', msg.author.username + ': ' + msg.content));
    fs.appendFile(path.join(logDir, fileName), `[${timestamp}]: ${msg.author.username}: ${msg.content}\n`, (err) => {
      if (err) {
        console.log(redBright('[-] Failed to write to log file:', err));
        return;
      }
    });

    messagesCount++;

    if (messagesCount >= messagesLimit) {
      const attachment = new MessageAttachment(path.join(logDir, fileName), fileName);
      await msg.channel.send({ files: [attachment] }).catch(err => {
        console.log(redBright('[-] Failed to send log file:', err));
        return;
      });
      console.log(greenBright('[+] Sent a log file:', fileName));
      messagesCount = 0;
    }
  }

  // Add the message to the cache
  messageCache.set(msg.id, msg);
});

// Deleted dms
client.on('messageDelete', async (msg) => {
  if (!msg.author || msg.author.id === client.user.id) return;
  if (msg.guild === null) {
    console.log(green("User" + " " + msg.author.username + " " + "has deleted a message..."));
    const cachedMsg = messageCache.get(msg.id);

    if (cachedMsg && cachedMsg.author.id !== client.user.id) {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const fileName = `DeletedMessages - ${cachedMsg.author.username} - ${cachedMsg.author.id}.txt`;
      const timestamp = new Date().toLocaleString();
      console.log('Logged a deleted message -', cachedMsg.author.username + ': ' + cachedMsg.content);
      fs.appendFile(path.join(logDir, fileName), `[${timestamp}]: ${cachedMsg.author.username}: ${cachedMsg.content}\n`, (err) => {
        if (err) {
          console.log('Failed to write to log file:', err);
          return;
        }
      });

      // Remove the message from the cache
      messageCache.delete(msg.id);

      // Send a message saying "I saw that. 😡" and delete it after 2 seconds
      const warningMsg = await msg.channel.send('I saw that. 😡');
      setTimeout(() => warningMsg.delete(), 2000);
    }
  }
});
