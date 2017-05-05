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
        <!--Hold / Resume-->
        <span class="fa-stack fa-lg text-info call-control btn-hold-resume"
              ng-if="sipml5.state.callConnected"
              uib-tooltip="{{sipml5.state.isCallOnHold? 'Resume the call' : 'Put the call on hold'}}"
              ng-click="sipml5.toggleHoldResume()">
          <i class="fa fa-circle fa-stack-2x"></i>
          <i class="fa fa-play fa-stack-1x fa-inverse" ng-if="sipml5.state.isCallOnHold"></i>
          <i class="fa fa-pause fa-sm fa-stack-1x fa-inverse" ng-if="!sipml5.state.isCallOnHold"></i>
        </span>
        <!--Mute / Unmute-->
        <span class="fa-stack fa-lg text-info call-control"
              ng-if="sipml5.state.callConnected"
              uib-tooltip="{{sipml5.state.callMuted? 'Unmute' : 'Mute'}}"
              ng-click="sipml5.toggleMute()">
          <i class="fa fa-circle fa-stack-2x"></i>
          <i class="fa fa-microphone fa-stack-1x fa-inverse" ng-if="!sipml5.state.callMuted"></i>
          <i class="fa fa-microphone-slash fa-stack-1x fa-inverse" ng-if="sipml5.state.callMuted"></i>
        </span>
        <!--Accept call-->
        <span class="fa-stack fa-lg accept-call-btn call-control"
              ng-if="sipml5.state.incomingCall && !sipml5.state.callConnected"
              uib-tooltip="{{sipml5.state.incomingCall? 'Accept' : ''}}"
              ng-click="sipml5.call()">
          <i class="fa fa-circle fa-stack-2x"></i>
          <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
        </span>
        <!--Hangup / Reject-->
        <span class="fa-stack fa-lg hangup-btn call-control"
              uib-tooltip="{{(sipml5.state.incomingCall && !sipml5.state.callConnected)? 'Reject' : 'Hangup'}}"
              ng-click="sipml5.hangup()">
          <i class="fa fa-circle fa-stack-2x"></i>
          <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
        </span>
        <!--Transfer-->
        <span class="fa-stack fa-lg text-info call-control btn-transfer"
              ng-class="{disabled: sipml5.state.transferringCall}"
              ng-if="sipml5.state.callConnected"
              uib-tooltip="{{sipml5.state.transferringCall? 'Transferring...' : 'Transfer the call'}}"
              ng-click="sipml5.transferCall()">
          <i class="fa fa-circle fa-stack-2x"></i>
          <i class="fa fa-share fa-stack-1x fa-inverse"></i>
        </span>
    </div>

</div>

<div ng-if="!(sipml5.state.calling || sipml5.state.callConnected || sipml5.state.incomingCall) && sipml5.state.registered && sipml5.callsLog && sipml5.callsLog.length">
    <div class="box-header">
        <h3 class="box-title">Recent Calls</h3>
        <div class="box-tools pull-right">
            <button type="button"
                    ng-click="sipml5.clearCallLog()"
                    class="btn btn-box-tool"
                    data-widget="collapse">
                Clear History
            </button>
        </div>
    </div>
    <div class="box-comments box-footer calls-log">
        <div class="box-comment call-log" ng-repeat="log in sipml5.callsLog track by $index">
            <!--missed-->
            <i class="fa fa-arrow-left text-danger rotate-135n call-direction"
               ng-if="log.incoming && !log.callDuration"
            ></i>
            <!--in-->
            <i class="fa fa-arrow-left text-info rotate-45n call-direction"
               ng-if="log.incoming && log.callDuration"
            ></i>
            <!--out-->
            <i class="fa fa-arrow-left text-success rotate-135 call-direction"
               ng-if="!log.incoming"
            ></i>
            <div class="comment-text">
            <span class="username">
                {{log.destinationName || log.destinationNumber}}
                <span class="text-muted pull-right">{{log.callDuration | duration:'%h%:%m%:%s%'}}</span>
            </span>
                {{log.endTime | date:'MMMM dd, yyyy hh:mm:ss a'}}
            </div>
        </div>
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
