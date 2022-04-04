// Require important things
const { Client, Intents, Collection } = require('discord.js');
const config = require('./config.json');

// config.cooldown HAS TO BE specified in milliseconds
const Users = new Map();
const cooldown = config.cooldown;

// Util
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Set all Intents
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES] });

// Send message to console
client.on('ready', () => {
    console.log(`[LOG] Connected to Discord with client ${client.user.tag} | Servers: ${client.guilds.cache.size}`);
    client.user.setActivity(`all Voice Channels 👀`, { type: 'WATCHING' }); //Set Activity
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    console.log('EVENT FIRED');

    let newChannel = newState.channel;
    let oldChannel = oldState.channel;
    const member = newState.member;

    // ping role
    const roleID = config.role;
    const role = newState.guild.roles.cache.find(r => r.id === roleID); // just use the VoiceState object itself

    if (!role) throw new Error(`Wasn't able to find role (${roleID}) `);

    if (newChannel?.id) { // false if id is undefined
        console.log('[LOG] Joined channel');
        // connect event
        if (!config.ignore_channel.includes(newChannel.id)) { // id must exist at this point
            // escape ignored channel
            // add role

            console.log('[LOG] Joined not ignored channel');

            // if timespan between user joining and right now is less than the cooldown, wait it out (custom sleep function);
            if (Date.now() - Users.get(member.id) < cooldown) {
                console.log('[LOG] Cooldown triggered');
                await sleep(cooldown); // should make script wait for specified cooldown
            }

            if (!member.voice.channel) return;

            try {
                await member.roles.add(role.id);
                Users.set(member.id, Date.now());
                console.log('[LOG] Added role');
            } catch (error) {
                console.log(`[ERROR] Wasn't able to add role \`${role.name}\` to member (${member.user.tag})`);
            }

        } else {  // channel IS ignored channel
            if (member.roles.cache.has(role.id)) {
                try {
                    await member.roles.remove(role.id);
                    console.log('[LOG] Removed role');
                } catch (error) {
                    console.log(`[ERROR] Wasn't able to remove role \`${role.name}\` from member (${member.user.tag})`);
                }
            }
        };
    }
    // disconnect event
    else {
        console.log('[LOG] Disconnect event');
        /* if (oldChannel.id === config.ignore_channel) return; // return if previous channel was ignored  */

        try {
            await member.roles.remove(role.id);
            console.log('[LOG] Removed role');
        } catch (error) {
            console.log(`[ERROR] Wasn't able to remove role \`${role.name}\` from member (${member.user.tag})`);
        }
    }
});

// Connect client to Discord
client.login(config.token);