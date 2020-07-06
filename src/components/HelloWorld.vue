<template>
  <div class="hello">
    <div class="row">
      <div class="col-md-offset-1 col-md-2 text-left">
        <label>
          User Id:
        </label>
      </div>
      <div class="col-md-2 text-left">
        <label>
          <input
            v-model="userId"
            type="text"
          >
        </label>
      </div>
    </div>
    <div class="row">
      <div class="col-md-offset-1 col-md-2 text-left">
        <label>
          Channel:
        </label>
      </div>
      <div class="col-md-2 text-left">
        <label>
          <input
            v-model="channelId"
            type="text"
          >
        </label>
      </div>
    </div>
    <div class="row">
      <div class="col-md-offset-1 col-md-2 text-left">
        <label>
          Role:
        </label>
      </div>
      <div class="col-md-2 text-left">
        <label>
          <select v-model="selectedRole">
            <option
              v-for="role in roles"
              :key="role"
              :value="role"
            >
              {{ role }}
            </option>
          </select>
        </label>
      </div>
    </div>
    <div class="row">
      <div class="col-md-offset-1 col-md-2 text-left">
        <label>
          Video device:
        </label>
      </div>
      <div class="col-md-6 text-left">
        <label>
          <select v-model="selectedVideoDevice">
            <option
              v-for="videoDevice in videoDevices"
              :key="videoDevice.value"
              :value="videoDevice"
            >
              {{ videoDevice.text }}
            </option>
          </select>
        </label>
      </div>
    </div>
    <div class="row">
      <div class="col-md-offset-1 col-md-2 text-left">
        <label>
          Audio device:
        </label>
      </div>
      <div class="col-md-6 text-left">
        <label>
          <select v-model="selectedAudioDevice">
            <option
              v-for="audioDevice in audioDevices"
              :key="audioDevice.value"
              :value="audioDevice"
            >
              {{ audioDevice.text }}
            </option>
          </select>
        </label>
      </div>
    </div>
    <div
      v-if="selectedRole === 'trainer'"
      class="row"
    >
      <button @click="startStreaming">
        Start lesson
      </button>
    </div>
    <div
      v-if="selectedRole === 'student'"
      class="row"
    >
      <button @click="startWatching">
        Start watching lessong
      </button>
    </div>
    <div class="row table-row">
      <div class="col-sm-12 col-md-12 col-lg-8">
        <div class="embed-responsive embed-responsive-16by9">
          <div
            id="video"
            class="embed-responsive-item"
          >
            <a
              id="fullscreen"
              href="#"
            ><i
              id="fullscreen-icon"
              class="fa fa-expand"
            /></a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */

  export default {
    name: 'HelloWorld',
    data() {
      return {
        deviceId: '1',
        applicationId: '1ff8eb2b-73c5-4710-87bd-036d15af95d2',
        selectedVideoDevice: null,
        videoDevices: [],
        selectedAudioDevice: null,
        audioDevices: [],
        localMedia: null,
        channelId: '1-2-3',
        selectedRole: 'trainer',
        userId: 'User name',
        roles: ['trainer', 'student'],
        layoutManager: null,
        currentChannel: null
      }
    },
    mounted() {
      const video = document.getElementById('video')
      this.layoutManager = new fm.liveswitch.DomLayoutManager(video)
      let vue = this;

      this.initialize().then((o)=> {
        vue.fillAudioDevices()
        vue.fillVideoDevices()
      });
    },
    watch: {
      selectedVideoDevice: {
        handler(device) {
          this.localMedia.changeVideoSourceInput(new fm.liveswitch.SourceInput(device.value, device.text))
            .then((o) => {
            }, (ex) => alert('Could not change video device. ' + (ex.message || ex.name)))
        }
      }
    },
    methods: {
      fillVideoDevices() {
        let currentVideoDevice = this.localMedia.getVideoSourceInput()
        this.localMedia.getVideoSourceInputs()
          .then((inputs) => {
            for (let i = 0; i < inputs.length; i++) {
              currentVideoDevice.getId()
              const input = inputs[i]
              let videoDevice = {
                value: input.getId(),
                text: input.getName()
              }

              if (currentVideoDevice.getId() === videoDevice.value) {
                this.selectedVideoDevice = videoDevice
              }

              this.videoDevices.push(videoDevice)
            }
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
      startStreaming() {
        let vue = this
        this.registerClient().then((r) => {
            let connection

            let dataChannel = new fm.liveswitch.DataChannel('data')
            let dataStream = new fm.liveswitch.DataStream(dataChannel)

            let audioStream = new fm.liveswitch.AudioStream(this.localMedia)
            let videoStream = new fm.liveswitch.VideoStream(this.localMedia)
            connection = vue.channel.createSfuUpstreamConnection(audioStream, videoStream, dataStream)
            connection.open()
            return connection
        });

      },
      registerClient() {
        let vueScope = this
        let promise = new fm.liveswitch.Promise();
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
            vueScope.channel.addOnRemoteUpstreamConnectionOpen((remoteConnectionInfo) => {
              console.log('addOnRemoteUpstreamConnectionOpen :' + remoteConnectionInfo.getId())
            })
            vueScope.channel.addOnPeerConnectionOffer((remoteConnectionInfo) => {
              console.log('addOnPeerConnectionOffer :' + remoteConnectionInfo.getId())
            })
            vueScope.channel.addOnMessage((client, message) => {
              console.log('addOnMessage :' + client.getUserId() + ' message: ' + message)
            })
            promise.resolve(null);
          })
          .fail((ex) => {
            promise.reject(new Error('registration failed'));
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

        const audio = true
        const video = new fm.liveswitch.VideoConfig(640, 480, 30)
        vueScope.localMedia = new fm.liveswitch.LocalMedia(audio, video)

        const pluginConfig = new fm.liveswitch.PluginConfig()
        pluginConfig.setActiveXPath('./FM.LiveSwitch.ActiveX.cab')
        fm.liveswitch.Plugin.install(pluginConfig)
          .then((result) => {
            vueScope.localMedia.start()
              .then(function (lm) {
                vueScope.showLocalPreview()
                promise.resolve(null);
              })
              .fail((ex) => {
                promise.reject(ex)
                console.log(ex.message)
              })
          })

        return promise
      },
      showLocalPreview() {
        // let localView = this.localMedia.getView()
        // if (localView != null) {
        //   localView.id = 'localView'
        //   this.layoutManager.setLocalView(localView)
        // }
      },
      startWatching() {
        let vue = this
        this.registerClient().then((o) => {
          this.channel.addOnRemoteUpstreamConnectionOpen(function (remoteConnectionInfo) {
            console.log('addOnRemoteUpstreamConnectionOpen');
            // Create remote media to manage incoming media.
            const remoteMedia = new fm.liveswitch.RemoteMedia()
            remoteMedia.setAudioMuted(false);
            remoteMedia.setVideoMuted(false);
            // Add the remote video view to the layout.
            if (remoteMedia.getView()) {
              remoteMedia.getView().id = 'remoteView_' + remoteMedia.getId();
            }
            vue.layoutManager.addRemoteView(remoteMedia.getId(), remoteMedia.getView());

            let audioStream = new fm.liveswitch.AudioStream(remoteMedia);
            let videoStream = new fm.liveswitch.VideoStream(remoteMedia);

            let encodings = remoteConnectionInfo.getVideoStream().getSendEncodings();
            if (encodings && encodings.length > 1) {
              for (var encoding in encodings) {
                fm.liveswitch.Log.debug("Remote encoding: " + encoding.toString());
              }

              videoStream.setRemoteEncoding(encodings[0]);
            }

            let dataChannel = new fm.liveswitch.DataChannel("data");
            let dataStream = new fm.liveswitch.DataStream(dataChannel);


            let connection = vue.channel.createSfuDownstreamConnection(remoteConnectionInfo, audioStream, videoStream, dataStream);
            connection.open();
            return connection;
          });
        });

      }
    }
  }
</script>
