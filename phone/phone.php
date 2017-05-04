<div class="phone-number" ng-if="!sipml5.state.registered">
    <input class="form-control phone-input"
           type="password"
           ng-model="sipml5.stackConfig.password"
           placeholder="Enter sip password to start using phone">
    <button class="btn btn-flat btn-primary call-btn"
            ng-click="sipml5.register()"
            ng-disabled="sipml5.state.registering || sipml5.state.registered">
        <i class="fa fa-sign-in"></i>
    </button>
</div>
<div class="phone-number" ng-if="sipml5.state.registered">
    <input class="form-control phone-input"
           ng-model="sipml5.state.callerNumber"
           placeholder="Phone number or sip address">
    <button class="btn btn-flat btn-success call-btn"
        ng-disabled="sipml5.state.calling || sipml5.state.callConnected || sipml5.state.incomingCall"
        ng-click="sipml5.call('call-audio')">
        <i class="fa fa-phone"></i>
    </button>
    <button class="btn btn-flat btn-success call-btn"
        ng-disabled="sipml5.state.calling || sipml5.state.callConnected || sipml5.state.incomingCall"
        ng-click="sipml5.call('call-audiovideo')">
        <i class="fa fa-video-camera"></i>
    </button>
</div>
<div class="clearfix"></div>
<div class="caller-info text-center"
     ng-if="sipml5.state.calling || sipml5.state.callConnected || sipml5.state.incomingCall">
    <div>
        <h4 ng-if="sipml5.state.incomingCall && !sipml5.state.callConnected">Incoming Call</h4>
        <h4 ng-if="sipml5.state.calling && !sipml5.state.callConnected">Outgoing Call</h4>
    </div>
    <div class="caller-img">
        <i class="fa fa-user"></i>
    </div>
    <div class="caller-name">
        <span>{{sipml5.state.callerName || sipml5.state.callerNumber}}</span>
    </div>
    <div class="call-duration" ng-if="sipml5.state.callDuration">{{sipml5.state.callDuration | duration:'%h%:%m%:%s%'}}</div>
    <div class="call-controls">
        <span class="fa-stack fa-lg text-info call-control"
              ng-if="sipml5.state.callConnected"
              uib-tooltip="{{sipml5.state.callMuted? 'Unmute' : 'Mute'}}"
              ng-click="sipml5.toggleMute()">
          <i class="fa fa-circle fa-stack-2x"></i>
          <i class="fa fa-microphone fa-stack-1x fa-inverse" ng-if="!sipml5.state.callMuted"></i>
          <i class="fa fa-microphone-slash fa-stack-1x fa-inverse" ng-if="sipml5.state.callMuted"></i>
        </span>
        <span class="fa-stack fa-lg accept-call-btn call-control"
              ng-if="sipml5.state.incomingCall && !sipml5.state.callConnected"
              uib-tooltip="{{sipml5.state.incomingCall? 'Accept' : ''}}"
              ng-click="sipml5.call()">
          <i class="fa fa-circle fa-stack-2x"></i>
          <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
        </span>
        <span class="fa-stack fa-lg hangup-btn call-control"
              uib-tooltip="{{(sipml5.state.incomingCall && !sipml5.state.callConnected)? 'Reject' : 'Hangup'}}"
              ng-click="sipml5.hangup()">
          <i class="fa fa-circle fa-stack-2x"></i>
          <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
        </span>
    </div>

</div>
<audio id="audio_remote" autoplay="autoplay"></audio>
<audio id="ringtone" loop src="sounds/ringtone.wav"></audio>
<audio id="ringbacktone" loop src="sounds/ringbacktone.wav"></audio>
<audio id="dtmfTone" src="sounds/dtmf.wav"></audio>

<div class="status-msg text-danger" ng-if="sipml5.state.errorMessage">
    <b>Error: </b>
    {{sipml5.state.errorMessage}}
</div>
<div class="status-msg" ng-if="sipml5.state.message">{{sipml5.state.message}}</div>
