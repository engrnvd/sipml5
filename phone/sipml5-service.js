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
                callerName: ''
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
            bandwidth: null,
            videoSize: null,
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

        var sTransferNumber;
        var oRingTone, oRingbackTone;
        var oSipStack, oSipSessionRegister, oSipSessionCall, oSipSessionTransferCall;
        var videoRemote, videoLocal, audioRemote;
        var bFullScreen = false;
        var oNotifICall;
        var bDisableVideo = false;
        var viewVideoLocal, viewVideoRemote, viewLocalScreencast; // <video> (webrtc) or <div> (webrtc4all)
        var oConfigCall;

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
                videoLocal = sip.videoLocal || document.getElementById("video_local");
                videoRemote = sip.videoRemote || document.getElementById("video_remote");
                audioRemote = sip.audioRemote || document.getElementById("audio_remote");

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

            // FIXME: displays must be per session
            viewVideoLocal = videoLocal;
            viewVideoRemote = videoRemote;

            if (!SIPml.isWebRtcSupported()) {
                sip.state.errorMessage = "Your browser doesn't support WebRTC. Audio / video calls will be disabled.";
                if (confirm(sip.state.errorMessage+'\nDo you want to download a WebRTC-capable browser?')) {
                    window.location = 'https://www.google.com/intl/en/chrome/browser/';
                }
            }

            sip.state.canRegister = true;
            oConfigCall = {
                audio_remote: audioRemote,
                video_local: viewVideoLocal,
                video_remote: viewVideoRemote,
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
                oSipStack = new SIPml.Stack(sip.stackConfig);
                if (oSipStack.start() != 0) {
                    sip.state.errorMessage = 'Failed to start the SIP stack';
                }
                else return;
            }
            catch (e) {
                sip.state.errorMessage = e;
            }
            sip.state.canRegister = true;
        };

        // sends SIP REGISTER (expires=0) to logout
        sip.unRegister = function () {
            if (oSipStack) {
                oSipStack.stop(); // shutdown all sessions
            }
        };

        // makes a call (SIP INVITE)
        function sipCall(type, phoneNumber) {
            sip.state.calling = true;
            sip.state.canCall = false;
            sip.state.canHangup = true;
            if (oSipStack && !oSipSessionCall && phoneNumber) { // outbound call
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

                oConfigCall.bandwidth = sip.bandwidth;
                oConfigCall.video_size = sip.videoSize;

                // create call session
                oSipSessionCall = oSipStack.newSession(type, oConfigCall);
                // make call
                if (oSipSessionCall.call(phoneNumber) != 0) {
                    oSipSessionCall = null;
                    sip.state.canCall = true;
                    sip.state.canHangup = false;
                    sip.state.callFailed = true;
                }
            }
            else if (oSipSessionCall) { // inbound
                oSipSessionCall.accept(oConfigCall);
            }

            if (oSipSessionCall) sip.state.callConnected = true;

            sip.state.calling = false;
            sip.state.incomingCall = false;
        }

        // Share entire desktop aor application using BFCP or WebRTC native implementation
        function sipShareScreen() {
            if (SIPml.getWebRtcType() === 'w4a') {
                // Sharing using BFCP -> requires an active session
                if (!oSipSessionCall) {
                    sip.state.errorMessage = 'No active session';
                    return;
                }
                if (oSipSessionCall.bfcpSharing) {
                    if (oSipSessionCall.stopBfcpShare(oConfigCall) != 0) {
                        sip.state.errorMessage = 'Failed to stop BFCP share';
                    }
                    else {
                        oSipSessionCall.bfcpSharing = false;
                    }
                }
                else {
                    oConfigCall.screencast_window_id = 0x00000000;
                    if (oSipSessionCall.startBfcpShare(oConfigCall) != 0) {
                        sip.state.errorMessage = 'Failed to start BFCP share';
                    }
                    else {
                        oSipSessionCall.bfcpSharing = true;
                    }
                }
            }
            else {
                sipCall('call-screenshare');
            }
        }

        // transfers the call
        function sipTransfer() {
            if (!oSipSessionCall) {
                sip.state.errorMessage = "No active call to transfer.";
                return;
            }

            sip.state.canTransferCall = false;
            var s_destination = prompt('Enter destination number', '');
            if (s_destination) {
                sip.state.errorMessage = "Please enter a destination.";
                return;
            }

            if (oSipSessionCall.transfer(s_destination) != 0) {
                sip.state.errorMessage = 'Call transfer failed';
                sip.state.canTransferCall = true;
                return;
            }

            sip.state.transferringCall = true;
        }

        // holds or resumes the call
        function sipToggleHoldResume() {
            if (oSipSessionCall) {
                sip.state.errorMessage = 'No active call to hold / resume';
                return;
            }

            var i_ret;
            sip.state.canHoldResume = false;
            i_ret = oSipSessionCall.bHeld ? oSipSessionCall.resume() : oSipSessionCall.hold();
            if (i_ret != 0) {
                sip.state.errorMessage = oSipSessionCall.bHeld ? 'Hold' : 'Resume';
                sip.state.errorMessage += ' failed';
                sip.state.canHoldResume = true;
            }
        }

        // Mute or Unmute the call
        function sipToggleMute() {
            if (oSipSessionCall) {
                var i_ret;
                var muted = !oSipSessionCall.bMute;
                i_ret = oSipSessionCall.mute('audio'/*could be 'video'*/, muted);
                if (i_ret != 0) {
                    sip.state.errorMessage = muted? 'Unmute' : 'Mute';
                    sip.state.errorMessage += ' failed';
                    return;
                }
                oSipSessionCall.bMute = muted;
            }
        }

        // terminates the call (SIP BYE or CANCEL)
        function sipHangUp() {
            if (oSipSessionCall) {
                oSipSessionCall.hangup({events_listener: {events: '*', listener: onSipEventSession}});
            }
        }

        function sipSendDTMF(c) {
            if (oSipSessionCall && c) {
                if (oSipSessionCall.dtmf(c) == 0) {
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
                if (oNotifICall) {
                    oNotifICall.cancel();
                }
                oNotifICall = window.webkitNotifications.createNotification('images/sipml-34x39.png', 'Incaming call', 'Incoming call from ' + s_number);
                oNotifICall.onclose = function () {
                    oNotifICall = null;
                };
                oNotifICall.show();
            }
        }

        function uiOnConnectionEvent(b_connected, b_connecting) { // should be enum: connecting, connected, terminating, terminated
            sip.state.canRegister = !b_connected && !b_connecting;
            sip.state.canUnRegister = b_connected || b_connecting;
            sip.state.canCall = b_connected && tsk_utils_have_webrtc() && tsk_utils_have_stream();
            sip.state.canHangup = oSipSessionCall;
        }

        function uiVideoDisplayEvent(b_local, b_added) {
            var o_elt_video = b_local ? videoLocal : videoRemote;

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
                        sipCall(bDisableVideo ? 'call-audio' : 'call-audiovideo');
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
                        sipCall(bDisableVideo ? 'call-audio' : 'call-audiovideo');
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

            oSipSessionCall = null;

            stopRingbackTone();
            stopRingTone();

            //txtCallStatus.innerHTML = "<i>" + s_description + "</i>";
            // uiVideoDisplayShowHide(false);
            //divCallOptions.style.opacity = 0;

            if (oNotifICall) {
                oNotifICall.cancel();
                oNotifICall = null;
            }

            //uiVideoDisplayEvent(false, false);
            //uiVideoDisplayEvent(true, false);

            // setTimeout(function () {
            //     if (!oSipSessionCall) txtCallStatus.innerHTML = '';
            // }, 2500);
        }

        // Callback function for SIP Stacks
        function onSipEventStack(e /*SIPml.Stack.Event*/) {
            console.log('==stack event = ' + e.type);
            switch (e.type) {
                case 'started':
                {
                    // catch exception for IE (DOM not ready)
                    try {
                        // LogIn (REGISTER) as soon as the stack finish starting
                        oSipSessionRegister = this.newSession('register', {
                            expires: 200,
                            events_listener: {events: '*', listener: onSipEventSession},
                            sip_caps: [
                                {name: '+g.oma.sip-im', value: null},
                                //{ name: '+sip.ice' }, // rfc5768: FIXME doesn't work with Polycom TelePresence
                                {name: '+audio', value: null},
                                {name: 'language', value: '\"en,fr\"'}
                            ]
                        });
                        oSipSessionRegister.register();
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
                    oSipStack = null;
                    oSipSessionRegister = null;
                    oSipSessionCall = null;

                    uiOnConnectionEvent(false, false);

                    stopRingbackTone();
                    stopRingTone();

                    sip.state.errorMessage = bFailure ? "Disconnected: " + e.description : "Disconnected.";
                    break;
                }

                case 'i_new_call':
                {
                    if (oSipSessionCall) {
                        // do not accept the incoming call if we're already 'in call'
                        e.newSession.hangup(); // comment this line for multi-line support
                    }
                    else {
                        sip.state.incomingCall = true;
                        oSipSessionCall = e.newSession;
                        // start listening for events
                        oSipSessionCall.setConfiguration(oConfigCall);

                        startRingTone();

                        var sRemoteNumber = (oSipSessionCall.getRemoteFriendlyName() || 'unknown');
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
            console.log('==session event = ' + e.type);

            switch (e.type) {
                case 'connecting':
                case 'connected':
                {
                    var bConnected = (e.type == 'connected');
                    if (e.session == oSipSessionRegister) {
                        uiOnConnectionEvent(bConnected, !bConnected);
                    }
                    else if (e.session == oSipSessionCall) {
                        sip.state.canCall = false;
                        sip.state.canHangup = true;
                        sip.state.canTransferCall = true;

                        if (bConnected) {
                            stopRingbackTone();
                            stopRingTone();

                            if (oNotifICall) {
                                oNotifICall.cancel();
                                oNotifICall = null;
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
                    if (e.session == oSipSessionRegister) {
                        uiOnConnectionEvent(false, false);

                        oSipSessionCall = null;
                        oSipSessionRegister = null;
                    }
                    else if (e.session == oSipSessionCall) {
                        uiCallTerminated(e.description);
                    }
                    break;
                } // 'terminating' | 'terminated'

                case 'm_stream_video_local_added':
                {
                    if (e.session == oSipSessionCall) {
                        uiVideoDisplayEvent(true, true);
                    }
                    break;
                }
                case 'm_stream_video_local_removed':
                {
                    if (e.session == oSipSessionCall) {
                        uiVideoDisplayEvent(true, false);
                    }
                    break;
                }
                case 'm_stream_video_remote_added':
                {
                    if (e.session == oSipSessionCall) {
                        uiVideoDisplayEvent(false, true);
                    }
                    break;
                }
                case 'm_stream_video_remote_removed':
                {
                    if (e.session == oSipSessionCall) {
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
                    oSipSessionTransferCall = e.session;
                    break;
                }

                case 'i_ao_request':
                {
                    if (e.session == oSipSessionCall) {
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
                    if (e.session == oSipSessionCall) {
                        stopRingbackTone();
                        stopRingTone();
                        //txtCallStatus.innerHTML = '<i>Early media started</i>';
                    }
                    break;
                }

                case 'm_local_hold_ok':
                {
                    if (e.session == oSipSessionCall) {
                        if (oSipSessionCall.bTransfering) {
                            oSipSessionCall.bTransfering = false;
                            // this.AVSession.TransferCall(this.transferUri);
                        }
                        sip.state.canHoldResume = true;
                        oSipSessionCall.bHeld = true;
                    }
                    break;
                }
                case 'm_local_hold_nok':
                {
                    if (e.session == oSipSessionCall) {
                        oSipSessionCall.bTransfering = false;
                        sip.state.canHoldResume = true;
                        sip.state.errorMessage = 'Failed to place remote party on hold';
                    }
                    break;
                }
                case 'm_local_resume_ok':
                {
                    if (e.session == oSipSessionCall) {
                        oSipSessionCall.bTransfering = false;
                        sip.state.canHoldResume = true;
                        oSipSessionCall.bHeld = false;

                        if (SIPml.isWebRtc4AllSupported()) { // IE don't provide stream callback yet
                            uiVideoDisplayEvent(false, true);
                            uiVideoDisplayEvent(true, true);
                        }
                    }
                    break;
                }
                case 'm_local_resume_nok':
                {
                    if (e.session == oSipSessionCall) {
                        oSipSessionCall.bTransfering = false;
                        sip.state.canHoldResume = true;
                        sip.state.errorMessage = 'Failed to unhold call';
                    }
                    break;
                }
                case 'm_remote_hold':
                {
                    if (e.session == oSipSessionCall) {
                        sip.state.isCallOnHoldByRemote = true;
                    }
                    break;
                }
                case 'm_remote_resume':
                {
                    if (e.session == oSipSessionCall) {
                        sip.state.isCallOnHoldByRemote = false;
                    }
                    break;
                }
                case 'm_bfcp_info':
                {
                    if (e.session == oSipSessionCall) {
                        //txtCallStatus.innerHTML = 'BFCP Info: <i>' + e.description + '</i>';
                    }
                    break;
                }

                case 'o_ect_trying':
                {
                    if (e.session == oSipSessionCall) {
                        sip.state.transferringCall = true;
                        sip.state.callTransferred = false;
                        //txtCallStatus.innerHTML = '<i>Call transfer in progress...</i>';
                    }
                    break;
                }
                case 'o_ect_accepted':
                {
                    if (e.session == oSipSessionCall) {
                        sip.state.transferringCall = false;
                        sip.state.callTransferred = true;
                        // txtCallStatus.innerHTML = '<i>Call transfer accepted</i>';
                    }
                    break;
                }
                case 'o_ect_completed':
                case 'i_ect_completed':
                {
                    if (e.session == oSipSessionCall) {
                        sip.state.transferringCall = false;
                        sip.state.callTransferred = true;
                        // txtCallStatus.innerHTML = '<i>Call transfer completed</i>';
                        // btnTransfer.disabled = false;
                        if (oSipSessionTransferCall) {
                            oSipSessionCall = oSipSessionTransferCall;
                        }
                        oSipSessionTransferCall = null;
                    }
                    break;
                }
                case 'o_ect_failed':
                case 'i_ect_failed':
                {
                    if (e.session == oSipSessionCall) {
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
                    if (e.session == oSipSessionCall) {
                        //txtCallStatus.innerHTML = "<i>Call Transfer: <b>" + e.getSipResponseCode() + " " + e.description + "</b></i>";
                        if (e.getSipResponseCode() >= 300) {
                            if (oSipSessionCall.bHeld) {
                                oSipSessionCall.resume();
                            }
                            sip.state.canTransferCall = true;
                        }
                    }
                    break;
                }
                case 'i_ect_requested':
                {
                    if (e.session == oSipSessionCall) {
                        var s_message = "Do you accept call transfer to [" + e.getTransferDestinationFriendlyName() + "]?";//FIXME
                        if (confirm(s_message)) {
                            //txtCallStatus.innerHTML = "<i>Call transfer in progress...</i>";
                            sip.state.transferringCall = true;
                            oSipSessionCall.acceptTransfer();
                            break;
                        }
                        oSipSessionCall.rejectTransfer();
                    }
                    break;
                }
            }
        }

        return sip;
    }
})();