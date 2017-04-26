<div class="phone-number">
    <input class="form-control phone-input"
           placeholder="Phone number or sip address">
    <button class="btn btn-flat btn-primary call-btn">
        <i class="fa fa-phone"></i>
    </button>
    <button class="btn btn-flat btn-primary call-btn">
        <i class="fa fa-video-camera"></i>
    </button>
</div>
<div class="clearfix"></div>
<div class="caller-info text-center">
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