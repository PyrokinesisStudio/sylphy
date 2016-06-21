import _ from 'lodash'
import path from 'path'
import async from 'async'
import jsonfile from 'jsonfile'

import AdminCommand from '../../Base/AdminCommand'

class PluginDisable extends AdminCommand {
  get name () {
    return 'disable'
  }

  get description () {
    return 'Disables all or specific commands for the channel'
  }

  get usage () {
    return '[command]'
  }

  handle (args) {
    const serverSettings = path.join(this.bot.dbPath, 'server-settings', `${this.message.server.id}.json`)
    async.waterfall([
      cb => {
        this.bot.verifyServerSettings(serverSettings)
        .then(() => cb(null))
        .catch(err => cb(err))
      },
      cb => {
        jsonfile.readFile(serverSettings, (err, data) => {
          if (err) return cb(err)
          return cb(null, data)
        })
      },
      (data, cb) => {
        if (args[0]) {
          let answered = false
          for (let mod in this.bot.plugins) {
            for (let command in this.bot.plugins[mod]) {
              command = this.bot.plugins[mod][command]
              if (command.name === args[0]) {
                if (Array.isArray(data.ignored[this.message.channel.id])) {
                  _.pull(data.ignored[this.message.channel.id], command.name)
                  data.ignored[this.message.channel.id].push(command.name)
                } else {
                  data.ignored[this.message.channel.id] = [command.name]
                }
                this.reply(`🔇  Disabled **${command.name}** on this channel.`)
                answered = true
              }
            }
          }
          if (answered === false) {
            this.reply(`Command \`${args[0]}\` not found. Aliases aren't allowed.`)
            return
          }
        } else {
          data.ignored[this.message.channel.id] = true
          this.reply(`🔇  Disabled all commands on this channel.`)
        }
        jsonfile.writeFile(serverSettings, data, { spaces: 2 }, err => {
          if (err) return cb(err)
          return cb(null)
        })
      }
    ], err => {
      if (err) {
        this.reply(`❎  **Error reading server settings**: ${err}`)
        return
      }
    })
  }
}

module.exports = PluginDisable