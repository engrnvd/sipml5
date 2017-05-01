<div class="phone-number" ng-if="sipml5.state">
    <input class="form-control phone-input"
           ng-model="sipml5.state.callerNumber"
           placeholder="Phone number or sip address">
    <button class="btn btn-flat btn-primary call-btn" ng-click="sipml5.call('call-audio')">
        <i class="fa fa-phone"></i>
    </button>
    <button class="btn btn-flat btn-primary call-btn" ng-click="sipml5.call('call-audiovideo')">
        <i class="fa fa-video-camera"></i>
    </button>
</div>
<div class="phone-number" ng-if="sipml5.state">
    <input class="form-control phone-input"
           type="password"
           ng-model="sipml5.stackConfig.password"
           placeholder="Enter sip password to start using phone">
    <button class="btn btn-flat btn-primary call-btn"
        ng-click="sipml5.register()"
        ng-disabled="!sipml5.state">
        <i class="fa fa-sign-in"></i>
    </button>
</div>
<div class="clearfix"></div>
<div class="caller-info text-center" ng-if="sipml5.state.calling || sipml5.state.callConnected">
    <div class="caller-img">
        <i class="fa fa-user"></i>
    </div>
    <div class="caller-name">Caller Name</div>
    <div class="call-duration">00:27</div>
    <div class="call-controls">
        <span class="fa-stack fa-lg hangup-btn">
          <i class="fa fa-circle fa-stack-2x"></i>
          <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
        </span>
    </div>

    <audio id="audio_remote" autoplay="autoplay"></audio>
    <audio id="ringtone" loop src="sounds/ringtone.wav"></audio>
    <audio id="ringbacktone" loop src="sounds/ringbacktone.wav"></audio>
    <audio id="dtmfTone" src="sounds/dtmf.wav"></audio>
</div>
<div class="status-msg" ng-if="sip.state.message">{{sip.state.message}}</div>