(function () {
    angular.module('myApp').factory('sipml5', SIPml5);

    function SIPml5() {
        var sip = {
            state: {
                initializing: false,
                initialized: true,
                errorMessage: '',
                canRegister: false, // whether to enable register button
                canUnRegister: false, // whether to enable logout button
                registering: false,
                registered: false,
                canCall: false,
                canHangup: false,
                calling: false,
                callConnected: false,
                callFailed: false,
                canTransferCall: false,
                transferringCall: false,
                callTransferred: false,
                canHoldResume: false,
                isCallOnHold: false,
                isCallOnHoldByRemote: false,
                callMuted: false,
                incomingCall: false,
                callerName: '',
                callerNumber: '',
                fullScreen: false
            },
            debugLevel: 'error',
            webRTCType: null,
            videoLocal: null, // dom element
            videoRemote: null, // dom element
            audioRemote: null, // dom element
            fps: null,
            maxVideoSize: null,
            maxBandwidthUp: null,
            maxBandwidthDown: null,
            zeroArtifacts: false,
            nativeDebug: false,
            disableVideo: false,
            // bandwidth: {audio: undefined, video: undefined},
            // videoSize: {minWidth: undefined, minHeight: undefined, maxWidth: undefined, maxHeight: undefined},
            stackConfig: {
                realm: '',
                impi: '',
                impu: '',
                password: '',
                display_name: '',
                websocket_proxy_url: null,
                outbound_proxy_url: null,
                ice_servers: [{url: 'stun:stun.l.google.com:19302'}],
                enable_rtcweb_breaker: true,
                events_listener: {events: '*', listener: onSipEventStack},
                enable_early_ims: true, // Must be true unless you're using a real IMS network
                enable_media_stream_cache: false,
                bandwidth: null, // could be redefined a session-level
                video_size: null, // could be redefined a session-level
                sip_headers: [
                    {name: 'User-Agent', value: 'IM-client/OMA1.0 sipML5-v1.2016.03.04'},
                    {name: 'Organization', value: 'Doubango Telecom'}
                ]
            }
        };

        // var sTransferNumber;
        //var oRingTone, oRingbackTone;
        //var sip.stack, sip.sessionRegister, sip.sessionCall, sip.sessionTransferCall;
        //var sip.videoRemote, sip.videoLocal, sip.audioRemote;
        //var sip.state.fullScreen = false;
        //var sip.notifICall;
        // var sip.disableVideo = false;
        //var sip.videoLocal, sip.videoRemote, viewLocalScreencast; // <video> (webrtc) or <div> (webrtc4all)
        //var sip.configCall;

        sip.init = function (config) {
            if (config.stackConfig) {
                angular.extend(sip.stackConfig, config.stackConfig);
                delete config.stackConfig;
            }
            angular.extend(sip, config);

            var readyStateTimer = setInterval(function () {
                if (document.readyState === "complete") {
                    clearInterval(readyStateTimer);
                    preInit();
                }
            }, 500);
        };

        function preInit() {
            sip.state.initializing = true;
            sip.state.initialized = false;
            sip.state.errorMessage = '';

            try {
                sip.videoLocal = sip.videoLocal || document.getElementById("video_local");
                sip.videoRemote = sip.videoRemote || document.getElementById("video_remote");
                sip.audioRemote = sip.audioRemote || document.getElementById("audio_remote");

                // set debug level
                SIPml.setDebugLevel(sip.debugLevel);

                if (sip.webRTCType) SIPml.setWebRtcType(sip.webRTCType);

                // initialize SIPML5
                SIPml.init(postInit);

                // set other options after initialization
                if (sip.fps) SIPml.setFps(parseFloat(sip.fps));
                if (sip.maxVideoSize) SIPml.setMaxVideoSize(sip.maxVideoSize);
                if (sip.maxBandwidthUp) SIPml.setMaxBandwidthUp(parseFloat(sip.maxBandwidthUp));
                if (sip.maxBandwidthDown) SIPml.setMaxBandwidthDown(parseFloat(sip.maxBandwidthDown));
                if (sip.zeroArtifacts) SIPml.setZeroArtifacts(sip.zeroArtifacts);
                if (sip.nativeDebug) SIPml.startNativeDebug();

                //var rinningApps = SIPml.getRunningApps();
                //var _rinningApps = Base64.decode(rinningApps);
                //console.log(_rinningApps);
            } catch (e) {
                sip.state.errorMessage = e;
            }

            sip.state.initializing = false;
            sip.state.initialized = true;
        }

        function postInit() {
            // check for WebRTC support
            if (!SIPml.isWebRtcSupported()) {
                sip.state.errorMessage = "Your browser doesn't support WebRTC. Audio / video calls will be disabled.";
                // is it chrome?
                if (SIPml.getNavigatorFriendlyName() == 'chrome') {
                    if (confirm(sip.state.errorMessage+"\nDo you want to see how to enable WebRTC?")) {
                        window.location = 'http://www.webrtc.org/running-the-demos';
                    }
                    return;
                }
                else {
                    sip.state.errorMessage = "webrtc-everywhere extension is not installed.";
                    if (confirm(sip.state.errorMessage+" Do you want to install it?\nIMPORTANT: You must restart your browser after the installation.")) {
                        window.location = 'https://github.com/sarandogou/webrtc-everywhere';
                    }
                    else {
                        // Must do nothing: give the user the chance to accept the extension
                        // window.location = "index.html";
                    }
                }
            }

            // checks for WebSocket support
            if (!SIPml.isWebSocketSupported()) {
                sip.state.errorMessage = "Your browser doesn\'t support WebSockets.";
                if (confirm(sip.state.errorMessage+'\nDo you want to download a WebSocket-capable browser?')) {
                    window.location = 'https://www.google.com/intl/en/chrome/browser/';
                }
                return;
            }

            if (!SIPml.isWebRtcSupported()) {
                sip.state.errorMessage = "Your browser doesn't support WebRTC. Audio / video calls will be disabled.";
                if (confirm(sip.state.errorMessage+'\nDo you want to download a WebRTC-capable browser?')) {
                    window.location = 'https://www.google.com/intl/en/chrome/browser/';
                }
            }

            sip.state.canRegister = true;
            sip.configCall = {
                audio_remote: sip.audioRemote,
                video_local: sip.videoLocal,
                video_remote: sip.videoRemote,
                screencast_window_id: 0x00000000, // entire desktop
                bandwidth: {audio: undefined, video: undefined},
                video_size: {minWidth: undefined, minHeight: undefined, maxWidth: undefined, maxHeight: undefined},
                events_listener: {events: '*', listener: onSipEventSession},
                sip_caps: [
                    {name: '+g.oma.sip-im'},
                    {name: 'language', value: '\"en,fr\"'}
                ]
            };
        }

        // sends SIP REGISTER request to login
        sip.register = function () {
            // catch exception for IE (DOM not ready)
            try {
                sip.state.canRegister = false;
                if (!sip.stackConfig.realm || !sip.stackConfig.impi || !sip.stackConfig.impu) {
                    sip.state.errorMessage = "Invalid config. Please contact developers.";
                    sip.state.canRegister = true;
                    return;
                }

                // enable notifications if not already done
                if (window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
                    window.webkitNotifications.requestPermission();
                }

                // update debug level to be sure new values will be used if the user haven't updated the page
                SIPml.setDebugLevel(sip.debugLevel);

                // create SIP stack
                sip.stack = new SIPml.Stack(sip.stackConfig);
                if (sip.stack.start() != 0) {
                    sip.state.errorMessage = 'Failed to start the SIP stack';
                    sip.state.canRegister = true;
                }
            }
            catch (e) {
                sip.state.errorMessage = e;
            }
        };

        // sends SIP REGISTER (expires=0) to logout
        sip.unRegister = function () {
            if (sip.stack) {
                sip.stack.stop(); // shutdown all sessions
            }
        };

        // makes a call (SIP INVITE)
        sip.call = function (type) {
            sip.state.calling = true;
            sip.state.canCall = false;
            sip.state.canHangup = true;
            var phoneNumber = sip.state.callerNumber;
            if (sip.stack && !sip.sessionCall && phoneNumber) { // outbound call
                if (type == 'call-screenshare') {
                    if (!SIPml.isScreenShareSupported()) {
                        sip.state.errorMessage = 'Screen sharing not supported. Are you using chrome 26+?';
                        return;
                    }
                    if (!location.protocol.match('https')) {
                        sip.state.errorMessage = "Screen sharing requires https";
                        return;
                    }
                }

                // sip.configCall.bandwidth = sip.bandwidth;
                // sip.configCall.video_size = sip.videoSize;

                // create call session
                sip.sessionCall = sip.stack.newSession(type, sip.configCall);
                // make call
                if (sip.sessionCall.call(phoneNumber) != 0) {
                    sip.sessionCall = null;
                    sip.state.canCall = true;
                    sip.state.canHangup = false;
                    sip.state.callFailed = true;
                }
            }
            else if (sip.sessionCall) { // inbound
                sip.sessionCall.accept(sip.configCall);
            }

            if (sip.sessionCall) sip.state.callConnected = true;

            sip.state.calling = false;
            sip.state.incomingCall = false;
        };

        // Share entire desktop aor application using BFCP or WebRTC native implementation
        function sipShareScreen() {
            if (SIPml.getWebRtcType() === 'w4a') {
                // Sharing using BFCP -> requires an active session
                if (!sip.sessionCall) {
                    sip.state.errorMessage = 'No active session';
                    return;
                }
                if (sip.sessionCall.bfcpSharing) {
                    if (sip.sessionCall.stopBfcpShare(sip.configCall) != 0) {
                        sip.state.errorMessage = 'Failed to stop BFCP share';
                    }
                    else {
                        sip.sessionCall.bfcpSharing = false;
                    }
                }
                else {
                    sip.configCall.screencast_window_id = 0x00000000;
                    if (sip.sessionCall.startBfcpShare(sip.configCall) != 0) {
                        sip.state.errorMessage = 'Failed to start BFCP share';
                    }
                    else {
                        sip.sessionCall.bfcpSharing = true;
                    }
                }
            }
            else {
                sip.call('call-screenshare');
            }
        }

        // transfers the call
        function sipTransfer() {
            if (!sip.sessionCall) {
                sip.state.errorMessage = "No active call to transfer.";
                return;
            }

            sip.state.canTransferCall = false;
            var s_destination = prompt('Enter destination number', '');
            if (s_destination) {
                sip.state.errorMessage = "Please enter a destination.";
                return;
            }

            if (sip.sessionCall.transfer(s_destination) != 0) {
                sip.state.errorMessage = 'Call transfer failed';
                sip.state.canTransferCall = true;
                return;
            }

            sip.state.transferringCall = true;
        }

        // holds or resumes the call
        function sipToggleHoldResume() {
            if (sip.sessionCall) {
                sip.state.errorMessage = 'No active call to hold / resume';
                return;
            }

            var i_ret;
            sip.state.canHoldResume = false;
            i_ret = sip.sessionCall.bHeld ? sip.sessionCall.resume() : sip.sessionCall.hold();
            if (i_ret != 0) {
                sip.state.errorMessage = sip.sessionCall.bHeld ? 'Hold' : 'Resume';
                sip.state.errorMessage += ' failed';
                sip.state.canHoldResume = true;
            }
        }

        // Mute or Unmute the call
        function sipToggleMute() {
            if (sip.sessionCall) {
                var i_ret;
                var muted = !sip.sessionCall.bMute;
                i_ret = sip.sessionCall.mute('audio'/*could be 'video'*/, muted);
                if (i_ret != 0) {
                    sip.state.errorMessage = muted? 'Unmute' : 'Mute';
                    sip.state.errorMessage += ' failed';
                    return;
                }
                sip.sessionCall.bMute = muted;
            }
        }

        // terminates the call (SIP BYE or CANCEL)
        sip.hangup = function () {
            if (sip.sessionCall) {
                sip.sessionCall.hangup({events_listener: {events: '*', listener: onSipEventSession}});
            }
        };

        function sipSendDTMF(c) {
            if (sip.sessionCall && c) {
                if (sip.sessionCall.dtmf(c) == 0) {
                    try {
                        dtmfTone.play();
                    } catch (e) {
                    }
                }
            }
        }

        function startRingTone() {
            try {
                ringtone.play();
            }
            catch (e) {
            }
        }

        function stopRingTone() {
            try {
                ringtone.pause();
            }
            catch (e) {
            }
        }

        function startRingbackTone() {
            try {
                ringbacktone.play();
            }
            catch (e) {
            }
        }

        function stopRingbackTone() {
            try {
                ringbacktone.pause();
            }
            catch (e) {
            }
        }

        function showNotifICall(s_number) {
            // permission already asked when we registered
            if (window.webkitNotifications && window.webkitNotifications.checkPermission() == 0) {
                if (sip.notifICall) {
                    sip.notifICall.cancel();
                }
                sip.notifICall = window.webkitNotifications.createNotification('images/sipml-34x39.png', 'Incaming call', 'Incoming call from ' + s_number);
                sip.notifICall.onclose = function () {
                    sip.notifICall = null;
                };
                sip.notifICall.show();
            }
        }

        function uiOnConnectionEvent(b_connected, b_connecting) { // should be enum: connecting, connected, terminating, terminated
            sip.state.canRegister = !b_connected && !b_connecting;
            sip.state.canUnRegister = b_connected || b_connecting;
            sip.state.canCall = b_connected && tsk_utils_have_webrtc() && tsk_utils_have_stream();
            sip.state.canHangup = sip.sessionCall;
        }

        function uiVideoDisplayEvent(b_local, b_added) {
            var o_elt_video = b_local ? sip.videoLocal : sip.videoRemote;

            if (b_added) {
                o_elt_video.style.opacity = 1;
                //uiVideoDisplayShowHide(true);
            }
            else {
                o_elt_video.style.opacity = 0;
                //fullScreen(false);
            }
        }

        function uiVideoDisplayShowHide(b_show) {
            if (b_show) {
                tdVideo.style.height = '340px';
                divVideo.style.height = navigator.appName == 'Microsoft Internet Explorer' ? '100%' : '340px';
            }
            else {
                tdVideo.style.height = '0px';
                divVideo.style.height = '0px';
            }
            btnFullScreen.disabled = !b_show;
        }

        function uiDisableCallOptions() {
            if (window.localStorage) {
                window.localStorage.setItem('org.doubango.expert.disable_callbtn_options', 'true');
                uiBtnCallSetText('Call');
                alert('Use expert view to enable the options again (/!\\requires re-loading the page)');
            }
        }

        function uiBtnCallSetText(s_text) {
            switch (s_text) {
                case "Call":
                {
                    var bDisableCallBtnOptions = (window.localStorage && window.localStorage.getItem('org.doubango.expert.disable_callbtn_options') == "true");
                    btnCall.value = btnCall.innerHTML = bDisableCallBtnOptions ? 'Call' : 'Call <span id="spanCaret" class="caret">';
                    btnCall.setAttribute("class", bDisableCallBtnOptions ? "btn btn-primary" : "btn btn-primary dropdown-toggle");
                    btnCall.onclick = bDisableCallBtnOptions ? function () {
                        sip.call(sip.disableVideo ? 'call-audio' : 'call-audiovideo');
                    } : null;
                    ulCallOptions.style.visibility = bDisableCallBtnOptions ? "hidden" : "visible";
                    if (!bDisableCallBtnOptions && ulCallOptions.parentNode != divBtnCallGroup) {
                        divBtnCallGroup.appendChild(ulCallOptions);
                    }
                    else if (bDisableCallBtnOptions && ulCallOptions.parentNode == divBtnCallGroup) {
                        document.body.appendChild(ulCallOptions);
                    }

                    break;
                }
                default:
                {
                    btnCall.value = btnCall.innerHTML = s_text;
                    btnCall.setAttribute("class", "btn btn-primary");
                    btnCall.onclick = function () {
                        sip.call(sip.disableVideo ? 'call-audio' : 'call-audiovideo');
                    };
                    ulCallOptions.style.visibility = "hidden";
                    if (ulCallOptions.parentNode == divBtnCallGroup) {
                        document.body.appendChild(ulCallOptions);
                    }
                    break;
                }
            }
        }

        function uiCallTerminated(s_description) {
            // uiBtnCallSetText("Call");
            // btnHangUp.value = 'HangUp';

            // btnHoldResume.value = 'hold';
            sip.state.isCallOnHold = false;

            // btnMute.value = "Mute";
            sip.state.callMuted = false;

            // btnCall.disabled = false;
            sip.state.canCall = true;

            // btnHangUp.disabled = true;
            sip.state.canHangup = false;

            sip.sessionCall = null;

            stopRingbackTone();
            stopRingTone();

            //txtCallStatus.innerHTML = "<i>" + s_description + "</i>";
            // uiVideoDisplayShowHide(false);
            //divCallOptions.style.opacity = 0;

            if (sip.notifICall) {
                sip.notifICall.cancel();
                sip.notifICall = null;
            }

            //uiVideoDisplayEvent(false, false);
            //uiVideoDisplayEvent(true, false);

            // setTimeout(function () {
            //     if (!sip.sessionCall) txtCallStatus.innerHTML = '';
            // }, 2500);
        }

        // Callback function for SIP Stacks
        function onSipEventStack(e /*SIPml.Stack.Event*/) {
            console.log('==stack event== ', e);
            switch (e.type) {
                case 'started':
                {
                    // catch exception for IE (DOM not ready)
                    try {
                        // LogIn (REGISTER) as soon as the stack finish starting
                        sip.sessionRegister = this.newSession('register', {
                            expires: 200,
                            events_listener: {events: '*', listener: onSipEventSession},
                            sip_caps: [
                                {name: '+g.oma.sip-im', value: null},
                                //{ name: '+sip.ice' }, // rfc5768: FIXME doesn't work with Polycom TelePresence
                                {name: '+audio', value: null},
                                {name: 'language', value: '\"en,fr\"'}
                            ]
                        });
                        sip.sessionRegister.register();
                    }
                    catch (e) {
                        sip.state.errorMessage = e;
                        sip.state.canRegister = true;
                    }
                    break;
                }
                case 'stopping':
                case 'stopped':
                case 'failed_to_start':
                case 'failed_to_stop':
                {
                    var bFailure = (e.type == 'failed_to_start') || (e.type == 'failed_to_stop');
                    sip.stack = null;
                    sip.sessionRegister = null;
                    sip.sessionCall = null;

                    uiOnConnectionEvent(false, false);

                    stopRingbackTone();
                    stopRingTone();

                    sip.state.errorMessage = bFailure ? "Disconnected: " + e.description : "Disconnected.";
                    break;
                }

                case 'i_new_call':
                {
                    if (sip.sessionCall) {
                        // do not accept the incoming call if we're already 'in call'
                        e.newSession.hangup(); // comment this line for multi-line support
                    }
                    else {
                        sip.state.incomingCall = true;
                        sip.sessionCall = e.newSession;
                        // start listening for events
                        sip.sessionCall.setConfiguration(sip.configCall);

                        startRingTone();

                        var sRemoteNumber = (sip.sessionCall.getRemoteFriendlyName() || 'unknown');
                        sip.state.callerName = sRemoteNumber;
                        showNotifICall(sRemoteNumber);
                    }
                    break;
                }

                case 'm_permission_requested':
                {
                    // grey background
                    //divGlassPanel.style.visibility = 'visible';
                    break;
                }
                case 'm_permission_accepted':
                case 'm_permission_refused':
                {
                    //divGlassPanel.style.visibility = 'hidden';
                    if (e.type == 'm_permission_refused') {
                        uiCallTerminated('Media stream permission denied');
                    }
                    break;
                }

                case 'starting':
                default:
                    break;
            }
        }

        // Callback function for SIP sessions (INVITE, REGISTER, MESSAGE...)
        function onSipEventSession(e /* SIPml.Session.Event */) {
            console.log('==session event==', e);

            switch (e.type) {
                case 'connecting':
                case 'connected':
                {
                    var bConnected = (e.type == 'connected');
                    if (e.session == sip.sessionRegister) {
                        uiOnConnectionEvent(bConnected, !bConnected);
                    }
                    else if (e.session == sip.sessionCall) {
                        sip.state.canCall = false;
                        sip.state.canHangup = true;
                        sip.state.canTransferCall = true;

                        if (bConnected) {
                            stopRingbackTone();
                            stopRingTone();

                            if (sip.notifICall) {
                                sip.notifICall.cancel();
                                sip.notifICall = null;
                            }
                        }

                        sip.state.callConnected = bConnected;

                        if (SIPml.isWebRtc4AllSupported()) { // IE don't provide stream callback
                            uiVideoDisplayEvent(false, true);
                            uiVideoDisplayEvent(true, true);
                        }
                    }
                    break;
                } // 'connecting' | 'connected'
                case 'terminating':
                case 'terminated':
                {
                    if (e.session == sip.sessionRegister) {
                        uiOnConnectionEvent(false, false);

                        sip.sessionCall = null;
                        sip.sessionRegister = null;
                    }
                    else if (e.session == sip.sessionCall) {
                        uiCallTerminated(e.description);
                    }
                    break;
                } // 'terminating' | 'terminated'

                case 'm_stream_video_local_added':
                {
                    if (e.session == sip.sessionCall) {
                        uiVideoDisplayEvent(true, true);
                    }
                    break;
                }
                case 'm_stream_video_local_removed':
                {
                    if (e.session == sip.sessionCall) {
                        uiVideoDisplayEvent(true, false);
                    }
                    break;
                }
                case 'm_stream_video_remote_added':
                {
                    if (e.session == sip.sessionCall) {
                        uiVideoDisplayEvent(false, true);
                    }
                    break;
                }
                case 'm_stream_video_remote_removed':
                {
                    if (e.session == sip.sessionCall) {
                        uiVideoDisplayEvent(false, false);
                    }
                    break;
                }

                case 'm_stream_audio_local_added':
                case 'm_stream_audio_local_removed':
                case 'm_stream_audio_remote_added':
                case 'm_stream_audio_remote_removed':
                {
                    break;
                }

                case 'i_ect_new_call':
                {
                    sip.sessionTransferCall = e.session;
                    break;
                }

                case 'i_ao_request':
                {
                    if (e.session == sip.sessionCall) {
                        var iSipResponseCode = e.getSipResponseCode();
                        if (iSipResponseCode == 180 || iSipResponseCode == 183) {
                            startRingbackTone();
                            //txtCallStatus.innerHTML = '<i>Remote ringing...</i>';
                        }
                    }
                    break;
                }

                case 'm_early_media':
                {
                    if (e.session == sip.sessionCall) {
                        stopRingbackTone();
                        stopRingTone();
                        //txtCallStatus.innerHTML = '<i>Early media started</i>';
                    }
                    break;
                }

                case 'm_local_hold_ok':
                {
                    if (e.session == sip.sessionCall) {
                        if (sip.sessionCall.bTransfering) {
                            sip.sessionCall.bTransfering = false;
                            // this.AVSession.TransferCall(this.transferUri);
                        }
                        sip.state.canHoldResume = true;
                        sip.sessionCall.bHeld = true;
                    }
                    break;
                }
                case 'm_local_hold_nok':
                {
                    if (e.session == sip.sessionCall) {
                        sip.sessionCall.bTransfering = false;
                        sip.state.canHoldResume = true;
                        sip.state.errorMessage = 'Failed to place remote party on hold';
                    }
                    break;
                }
                case 'm_local_resume_ok':
                {
                    if (e.session == sip.sessionCall) {
                        sip.sessionCall.bTransfering = false;
                        sip.state.canHoldResume = true;
                        sip.sessionCall.bHeld = false;

                        if (SIPml.isWebRtc4AllSupported()) { // IE don't provide stream callback yet
                            uiVideoDisplayEvent(false, true);
                            uiVideoDisplayEvent(true, true);
                        }
                    }
                    break;
                }
                case 'm_local_resume_nok':
                {
                    if (e.session == sip.sessionCall) {
                        sip.sessionCall.bTransfering = false;
                        sip.state.canHoldResume = true;
                        sip.state.errorMessage = 'Failed to unhold call';
                    }
                    break;
                }
                case 'm_remote_hold':
                {
                    if (e.session == sip.sessionCall) {
                        sip.state.isCallOnHoldByRemote = true;
                    }
                    break;
                }
                case 'm_remote_resume':
                {
                    if (e.session == sip.sessionCall) {
                        sip.state.isCallOnHoldByRemote = false;
                    }
                    break;
                }
                case 'm_bfcp_info':
                {
                    if (e.session == sip.sessionCall) {
                        //txtCallStatus.innerHTML = 'BFCP Info: <i>' + e.description + '</i>';
                    }
                    break;
                }

                case 'o_ect_trying':
                {
                    if (e.session == sip.sessionCall) {
                        sip.state.transferringCall = true;
                        sip.state.callTransferred = false;
                        //txtCallStatus.innerHTML = '<i>Call transfer in progress...</i>';
                    }
                    break;
                }
                case 'o_ect_accepted':
                {
                    if (e.session == sip.sessionCall) {
                        sip.state.transferringCall = false;
                        sip.state.callTransferred = true;
                        // txtCallStatus.innerHTML = '<i>Call transfer accepted</i>';
                    }
                    break;
                }
                case 'o_ect_completed':
                case 'i_ect_completed':
                {
                    if (e.session == sip.sessionCall) {
                        sip.state.transferringCall = false;
                        sip.state.callTransferred = true;
                        // txtCallStatus.innerHTML = '<i>Call transfer completed</i>';
                        // btnTransfer.disabled = false;
                        if (sip.sessionTransferCall) {
                            sip.sessionCall = sip.sessionTransferCall;
                        }
                        sip.sessionTransferCall = null;
                    }
                    break;
                }
                case 'o_ect_failed':
                case 'i_ect_failed':
                {
                    if (e.session == sip.sessionCall) {
                        sip.state.errorMessage = 'Call transfer failed';
                        sip.state.canTransferCall = true;
                        sip.state.transferringCall = false;
                        sip.state.callTransferred = false;
                    }
                    break;
                }
                case 'o_ect_notify':
                case 'i_ect_notify':
                {
                    if (e.session == sip.sessionCall) {
                        //txtCallStatus.innerHTML = "<i>Call Transfer: <b>" + e.getSipResponseCode() + " " + e.description + "</b></i>";
                        if (e.getSipResponseCode() >= 300) {
                            if (sip.sessionCall.bHeld) {
                                sip.sessionCall.resume();
                            }
                            sip.state.canTransferCall = true;
                        }
                    }
                    break;
                }
                case 'i_ect_requested':
                {
                    if (e.session == sip.sessionCall) {
                        var s_message = "Do you accept call transfer to [" + e.getTransferDestinationFriendlyName() + "]?";//FIXME
                        if (confirm(s_message)) {
                            //txtCallStatus.innerHTML = "<i>Call transfer in progress...</i>";
                            sip.state.transferringCall = true;
                            sip.sessionCall.acceptTransfer();
                            break;
                        }
                        sip.sessionCall.rejectTransfer();
                    }
                    break;
                }
                case 'sent_request':
                    break;
            }
        }

        return sip;
    }
})();