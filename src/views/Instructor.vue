<template>
  <v-container>
    <v-row no-gutters>
      <v-col
        sm="12"
        cols="12"
      >
        <v-card
          ref="form"
          class="pa-6"
          tile
        >
          <v-card-title>
            Settings
            <v-btn
              icon
              @click="showSettings = !showSettings"
            >
              <v-icon>{{ showSettings ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </v-card-title>
          <v-expand-transition>
            <div v-show="showSettings">
              <v-text-field
                ref="userId"
                v-model="userId"
                :disabled="settingsDisabled"
                label="User ID"
                required
                :rules="[rules.required]"
              />
              <v-select
                v-model="selectedVideoDevice"
                :disabled="settingsDisabled"
                :items="videoDevices"
                label="Video device"
              />
              <v-select
                v-model="selectedAudioDevice"
                :disabled="settingsDisabled"
                :items="audioDevices"
                label="Audio device"
              />
              <v-card-actions>
                <v-btn
                  :disabled="settingsDisabled || goLiveLoading"
                  color="primary"
                  :loading="goLiveLoading"
                  @click="goLive"
                >
                  Go live
                </v-btn>
              </v-card-actions>
            </div>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
    <v-row
      v-show="liveLink"
    >
      <v-col
        sm="12"
        cols="12"
      >
        <v-card
          ref="form"
          class="pa-6"
          tile
        >
          <v-card-title>
            You are live now!
          </v-card-title>
          <v-card-text>
            <strong>Your channel ID: <kbd>{{ channelId }}</kbd></strong>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              @click="copyLiveLink"
            >
              Copy live link
            </v-btn>
            <v-btn
              color="error"
              @click="stopLive"
            >
              Stop
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="4"
      >
        <v-card
          class="pa-4"
          tile
          style="position:relative"
        >
          <v-card-title>
            Preview
          </v-card-title>
          <v-responsive
            id="video"
            :aspect-ratio="4/3"
          />
        </v-card>
      </v-col>
      <v-col
        cols="12"
        sm="8"
      >
        <v-card
          v-if="channel"
          class="pa-4"
          tile
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
  // @ is an alias to /src
  // import HelloWorld from '@/components/HelloWorld.vue'
import Clipboard from '@/lib/copy-to-clipboard'

  export default {
    data() {
      return {
        rules: { required: value => !!value || 'Required.' },
        showSettings: true,
        deviceId: '1',
        applicationId: '1ff8eb2b-73c5-4710-87bd-036d15af95d2',
        selectedVideoDevice: null,
        videoDevices: [],
        selectedAudioDevice: null,
        audioDevices: [],
        localMedia: null,
        channelId: this.generateChannelId(),
        selectedRole: 'trainer',
        userId: '',
        roles: ['trainer', 'student'],
        layoutManager: null,
        currentChannel: null,
        liveLink: '',
        settingsDisabled: false,
        chat: [],
        chatMessage: '',
        channel: null,
        goLiveLoading: false
      }
    },
    mounted() {
      const video = document.getElementById('video')
      this.layoutManager = new fm.liveswitch.DomLayoutManager(video)
      let vue = this

      this.initialize()
        .then((o) => {
          vue.fillAudioDevices()
          vue.fillVideoDevices()
        })
    },
    computed: {
      form() {
        return {
          userId: this.userId
        }
      }
    },
    watch: {
      selectedVideoDevice: {
        handler(deviceId) {
          let device = this.videoDevices.find(d => d.value === deviceId)
          this.localMedia.changeVideoSourceInput(new fm.liveswitch.SourceInput(device.value, device.text))
            .then((o) => {
            }, (ex) => alert('Could not change video device. ' + (ex.message || ex.name)))
        }
      }
    },
    methods: {
      generateChannelId() {
        function S4() {
          return (((1 + Math.random()) * 0x10000) | 0).toString(16)
            .substring(1)
        }

        return (S4() + S4() + '-' + S4() + '-4' + S4()
          .substr(0, 3) + '-' + S4() + '-' + S4() + S4() + S4()).toLowerCase()
      },
      generateLink() {
        return `${window.location.hostname}/trainee/${this.channelId}`
      },
      copyLiveLink() {
        Clipboard.copy(this.liveLink)
      },
      sendChatMessage() {
        if (this.channel) {
          this.channel.sendMessage(this.chatMessage)
          this.chatMessage = ''
        }
      },
      fillVideoDevices() {
        let currentVideoDevice = this.localMedia.getVideoSourceInput()
        this.localMedia.getVideoSourceInputs()
          .then((inputs) => {
            for (let i = 0; i < inputs.length; i++) {
              const input = inputs[i]
              let videoDevice = {
                value: input.getId(),
                text: input.getName()
              }

              this.videoDevices.push(videoDevice)
            }

            this.selectedVideoDevice = currentVideoDevice.getId()
          })
      },
      fillAudioDevices() {
        let currentAudioDevice = this.localMedia.getAudioSourceInput()
        this.localMedia.getAudioSourceInputs()
          .then((inputs) => {
            for (let i = 0; i < inputs.length; i++) {
              currentAudioDevice.getId()
              const input = inputs[i]
              let audioDevice = {
                value: input.getId(),
                text: input.getName()
              }

              if (currentAudioDevice.getId() === audioDevice.value) {
                this.selectedAudioDevice = audioDevice
              }

              this.audioDevices.push(audioDevice)
            }
          })
      },
      validateForm() {
        for (const key in this.form) {
          this.$refs[key].validate(true)
          if (!this.form[key]) {
            return false
          }
        }

        return true
      },
      goLive() {
        if (!this.validateForm()) {
          return
        }

        let vue = this
        this.goLiveLoading = true
        this.registerClient()
          .then((r) => {
            let connection

            let dataChannel = new fm.liveswitch.DataChannel('data')
            let dataStream = new fm.liveswitch.DataStream(dataChannel)

            let audioStream = new fm.liveswitch.AudioStream(this.localMedia)
            let videoStream = new fm.liveswitch.VideoStream(this.localMedia)
            connection = vue.channel.createSfuUpstreamConnection(audioStream, videoStream, dataStream)
            connection.open()
            vue.liveLink = vue.generateLink()
            vue.settingsDisabled = true
            vue.showSettings = false
            this.goLiveLoading = false
            return connection
          })

      },
      stopLive() {
        this.localMedia.destroy()
        this.settingsDisabled = false
        this.liveLink = ''
        this.showSettings = true
        this.channel = null
      },
      registerClient() {
        let vueScope = this
        let promise = new fm.liveswitch.Promise()
        const client = new fm.liveswitch.Client('https://cloud.liveswitch.io/', this.applicationId, this.userId, this.deviceId, null, this.selectedRole)
        const token = fm.liveswitch.Token.generateClientRegisterToken(
          this.applicationId,
          client.getUserId(),
          client.getDeviceId(),
          client.getId(),
          client.getRoles(),
          [new fm.liveswitch.ChannelClaim(vueScope.channelId)],
          '23c27115d3084950bae420fde3d0a2f2da6269d78b854480b643e1b2e950d1fb'
        )

        client.register(token)
          .then((channels) => {
            console.log('connected to channel: ' + channels[0].getId())
            vueScope.channel = channels[0]
            vueScope.channel.addOnRemoteClientJoin((remoteConnectionInfo) => {
              console.log('Remote Client Join :' + remoteConnectionInfo.getUserId())
            })
            vueScope.channel.addOnRemoteClientLeave((remoteConnectionInfo) => {
              console.log('Remote Client Leave :' + remoteConnectionInfo.getUserId())
            })
            vueScope.channel.addOnMessage((client, message) => {
              let name = client.getUserAlias() != null ? client.getUserAlias() : client.getUserId()
              vueScope.chat.push({
                name: name,
                message: message
              })
            })
            promise.resolve(null)
          })
          .fail((ex) => {
            promise.reject(new Error('registration failed'))
            console.log('registration failed')
          })

        return promise
      },
      initialize() {
        let vueScope = this
        let promise = new fm.liveswitch.Promise()
        // for development
        fm.liveswitch.Log.setLogLevel(fm.liveswitch.LogLevel.Debug)
        fm.liveswitch.Log.registerProvider(new fm.liveswitch.ConsoleLogProvider(fm.liveswitch.LogLevel.Debug))

        const audio = {echoCancellation: false}
        const video = new fm.liveswitch.VideoConfig(640, 480, 30)
        vueScope.localMedia = new fm.liveswitch.LocalMedia(audio, video)

        const pluginConfig = new fm.liveswitch.PluginConfig()
        pluginConfig.setActiveXPath('./FM.LiveSwitch.ActiveX.cab')
        fm.liveswitch.Plugin.install(pluginConfig)
          .then((result) => {
            vueScope.localMedia.start()
              .then(function (lm) {
                vueScope.showLocalPreview()
                promise.resolve(null)
              })
              .fail((ex) => {
                promise.reject(ex)
                console.log(ex.message)
              })
          })

        return promise
      },
      showLocalPreview() {
        let localView = this.localMedia.getView()
        if (localView != null) {
          localView.id = 'localView'
          this.layoutManager.setLocalView(localView)
        }
      },
      startWatching() {
        let vue = this
        this.registerClient()
          .then((o) => {
            this.channel.addOnRemoteUpstreamConnectionOpen(function (remoteConnectionInfo) {
              // Create remote media to manage incoming media.
              const remoteMedia = new fm.liveswitch.RemoteMedia()
              remoteMedia.setAudioMuted(false)
              remoteMedia.setVideoMuted(false)
              // Add the remote video view to the layout.
              if (remoteMedia.getView()) {
                remoteMedia.getView().id = 'remoteView_' + remoteMedia.getId()
              }
              vue.layoutManager.addRemoteView(remoteMedia.getId(), remoteMedia.getView())

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
              return connection
            })
          })

      }
    }
  }
</script>

<style>
  .fm-video {
    width: 640px;
    height: 480px;
  }
</style>
