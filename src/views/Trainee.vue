<template>
  <v-container
    class="fill-height"
    fluid
  >
    <v-row
      align="center"
      justify="center"
      v-show="!channel"
    >
      <v-col
        cols="12"
        sm="8"
        md="4"
      >
        <v-card class="elevation-12">
          <v-toolbar
            color="primary"
            dark
            flat
          >
            <v-toolbar-title>Join to a live stream</v-toolbar-title>
            <v-spacer />
            <v-tooltip bottom>
              <v-icon>mdi-login-variant</v-icon>
              <span>Source</span>
            </v-tooltip>
          </v-toolbar>
          <v-card-text>
            <v-form>
              <v-text-field
                v-model="userId"
                label="User name"
                prepend-icon="mdi-account"
                type="text"
              />

              <v-text-field
                v-show="!$route.params.channelId"
                v-model="channelId"
                label="Channel Id"
                prepend-icon="mdi-lock"
                type="text"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              :disabled="!userId || !channelId"
              color="primary"
              :loading="joining"
              @click="join"
            >
              Join
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-show="channel">
      <v-col
        cols="12"
        sm="6"
      >
        <v-card
          class="pa-4"
          tile
          width="700"
          height="650"
          style="position:relative"
        >
          <v-card-title>
            Live video
          </v-card-title>
          <v-responsive
            id="video"
            :aspect-ratio="4/3"
          />
        </v-card>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-card
          v-if="channel"
          class="pa-4"
          tile
          style="position:relative"
          height="450"
        >
          <v-card-title>
            Chat
          </v-card-title>
          <v-virtual-scroll
            :items="chat"
            :item-height="50"
            height="300"
          >
            <template v-slot="{ item }">
              <v-list-item>
                <v-list-item-content class="elevation-2 pa-2 rounded">
                  <span class="text-truncate">
                    <strong>{{ item.name }}: </strong> {{ item.message }}</span>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-virtual-scroll>
          <v-card-actions>
            <v-text-field
              v-model="chatMessage"
              class="pa-2"
            />
            <v-btn
              color="primary"
              class="pa-2 ml-3"
              @click="sendChatMessage"
            >
              Send
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/* eslint-disable */

  export default {
    data() {
      return {
        userId: '',
        channelId: this.$route.params.channelId,
        channel: null,
        joining: false,
        chat: [],
        chatMessage: '',
      }
    },
    methods: {
      sendChatMessage() {
        if (this.channel) {
          this.channel.sendMessage(this.chatMessage)
          this.chatMessage = ''
        }
      },
      join() {
        let vue = this
        vue.joining = true
        fm.liveswitch.Log.setLogLevel(fm.liveswitch.LogLevel.Debug)
        fm.liveswitch.Log.registerProvider(new fm.liveswitch.ConsoleLogProvider(fm.liveswitch.LogLevel.Debug))

        const video = document.getElementById('video')
        const layoutManager = new fm.liveswitch.DomLayoutManager(video)

        const applicationId = '1ff8eb2b-73c5-4710-87bd-036d15af95d2'
        const deviceId = '2'

        const client = new fm.liveswitch.Client('https://cloud.liveswitch.io/', applicationId, vue.userId, deviceId, null, ['role2'])
        const token = fm.liveswitch.Token.generateClientRegisterToken(
          applicationId,
          client.getUserId(),
          client.getDeviceId(),
          client.getId(),
          client.getRoles(),
          [new fm.liveswitch.ChannelClaim(vue.channelId)],
          '23c27115d3084950bae420fde3d0a2f2da6269d78b854480b643e1b2e950d1fb'
        )

        client.register(token)
          .then((channels) => {
            vue.channel = channels[0]
            vue.channel.addOnMessage((client, message) => {
              let name = client.getUserAlias() != null ? client.getUserAlias() : client.getUserId()
              vue.chat.push({
                name: name,
                message: message
              })
            })
            vue.channel.addOnRemoteUpstreamConnectionOpen(function (remoteConnectionInfo) {
              // Create remote media to manage incoming media.
              const remoteMedia = new fm.liveswitch.RemoteMedia()
              remoteMedia.setAudioMuted(false)
              remoteMedia.setVideoMuted(false)
              // Add the remote video view to the layout.
              if (remoteMedia.getView()) {
                remoteMedia.getView().id = 'remoteView_' + remoteMedia.getId()
              }
              layoutManager.addRemoteView(remoteMedia.getId(), remoteMedia.getView())

              let audioStream = new fm.liveswitch.AudioStream(remoteMedia)
              let videoStream = new fm.liveswitch.VideoStream(remoteMedia)

              let encodings = remoteConnectionInfo.getVideoStream()
                .getSendEncodings()
              if (encodings && encodings.length > 1) {
                for (var encoding in encodings) {
                  fm.liveswitch.Log.debug('Remote encoding: ' + encoding.toString())
                }

                videoStream.setRemoteEncoding(encodings[0])
              }

              let dataChannel = new fm.liveswitch.DataChannel('data')
              let dataStream = new fm.liveswitch.DataStream(dataChannel)

              let connection = vue.channel.createSfuDownstreamConnection(remoteConnectionInfo, audioStream, videoStream, dataStream)
              connection.open()
              vue.joining = false
              return connection
            })

          })
          .fail((ex) => {
            console.log('registration failed')
          })
      }
    }
  }
</script>


<style>
  .fm-video {
    width: 500px;
    height: 500px;
  }
</style>
