(function () {
    angular.module('myApp').factory('sipml5', SIPml5);

    function SIPml5($rootScope, $interval, nvdStorage) {
        var sip = {
            state: {
                initializing: false,
                initialized: true,
                errorMessage: '',
                message: '',
                registering: false,
                registered: false,
                calling: false,
                callConnected: false,
                callDuration: 0,
                callFailed: false,
                transferringCall: false,
                callTransferred: false,
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
            callTimerId: null,
            callsLog: [],
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

        sip.getCallsLogFromStorage = function () {
            sip.callsLog = nvdStorage.get('callsLog');
        };

        sip.startCallTimer = function () {
            sip.callTimerId = $interval(function () {
                sip.state.callDuration ++;
            }, 1000);
        };
        
        sip.stopCallTimer = function () {
            sip.state.callDuration = 0;
            $interval.cancel(sip.callTimerId);
            sip.callTimerId = null;
        };

        sip.currentCallInfo = function () {
            var info = {
                incoming: sip.state.incomingCall,
                callDuration: sip.state.callDuration,
                destinationNumber: sip.state.callerNumber,
                destinationName: sip.state.callerName
            };
            info.endTime = new Date();
            info.endTimeStamp = Math.floor(Date.now() / 1000);
            info.startTimeStamp = info.endTimeStamp - info.callDuration;
            info.startTime = new Date(info.startTimeStamp * 1000);
            return info;
        };

        sip.saveCurrentCallLog = function () {
            var log = sip.callsLog;
            if (!log || !Array.isArray(log)) {
                log = [];
            }
            log.unshift(sip.currentCallInfo());
            nvdStorage.set('callsLog', log);
            sip.getCallsLogFromStorage();
        };

        sip.clearCallLog = function () {
            if (confirm('Are you sure?')) {
                nvdStorage.remove('callsLog');
                sip.getCallsLogFromStorage();
            }
        };

        // var sTransferNumber;
        //var oRingTone, oRingbackTone;
        //var sip.stack, sip.sessionRegister, sip.sessionCall, sip.sessionTransferCall;
        //var sip.videoRemote, sip.videoLocal, sip.audioRemote;
        //var sip.videoLocal, sip.videoRemote, viewLocalScreencast; // <video> (webrtc) or <div> (webrtc4all)
        //var sip.configCall;

        sip.setState = function (prop, value) {
            try {
                $rootScope.$apply(function () {
                    if (prop == 'errorMessage') sip.state.message = '';
                    if (prop == 'message') sip.state.errorMessage = '';
                    sip.state[prop] = value;
                });
            } catch (e) {
                sip.state[prop] = value;
            }
        };

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

                sip.getCallsLogFromStorage();

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
                if (!sip.stackConfig.realm || !sip.stackConfig.impi || !sip.stackConfig.impu) {
                    sip.state.errorMessage = "Invalid config. Please contact developers.";
                    return;
                }

                // enable notifications if not already done
                if (window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
                    window.webkitNotifications.requestPermission();
                }

                // create SIP stack
                sip.state.registering = true;
                sip.stack = new SIPml.Stack(sip.stackConfig);
                if (sip.stack.start() != 0) {
                    sip.state.errorMessage = 'Failed to start the SIP stack';
                    sip.state.registering = false;
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
            try {
                var phoneNumber = sip.state.callerNumber;
                if (sip.stack && !sip.sessionCall && phoneNumber) { // outbound call
                    sip.state.calling = true;
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

                    // create call session
                    sip.sessionCall = sip.stack.newSession(type, sip.configCall);
                    // make call
                    if (sip.sessionCall.call(phoneNumber) != 0) {
                        sip.sessionCall = null;
                        sip.state.callFailed = true;
                        sip.state.calling = false;
                    }
                }
                else if (sip.sessionCall) { // inbound
                    sip.sessionCall.accept(sip.configCall);
                }
            } catch (e) {
                if (sip.sessionCall) {
                    sip.hangup();
                    sip.sessionCall = null;
                }
                sip.state.callFailed = true;
                sip.state.calling = false;
                console.error(e);
            }
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
        sip.transferCall = function () {
            if (sip.state.transferringCall) return;

            if (!sip.sessionCall) {
                sip.state.errorMessage = "No active call to transfer.";
                return;
            }

            var s_destination = prompt('Enter destination number', '');
            if (!s_destination) {
                sip.state.errorMessage = "Please enter a destination.";
                return;
            }

            sip.state.transferringCall = true;
            sip.state.message = 'Transferring call...';
            if (sip.sessionCall.transfer(s_destination) != 0) {
                sip.state.errorMessage = 'Call transfer failed';
                sip.state.transferringCall = false;
            }
        };

        // holds or resumes the call
        sip.toggleHoldResume = function () {
            if (!sip.sessionCall) {
                sip.state.errorMessage = 'No active call to hold / resume';
                return;
            }

            var i_ret;
            i_ret = sip.sessionCall.bHeld ? sip.sessionCall.resume() : sip.sessionCall.hold();
            if (i_ret != 0) {
                sip.state.errorMessage = sip.sessionCall.bHeld ? 'Hold' : 'Resume';
                sip.state.errorMessage += ' failed';
            }
        };

        // Mute or Unmute the call
        sip.toggleMute = function () {
            if (sip.sessionCall) {
                var i_ret;
                var muted = !sip.state.callMuted;
                i_ret = sip.sessionCall.mute('audio'/*could be 'video'*/, muted);
                if (i_ret != 0) {
                    sip.state.errorMessage = muted ? 'Unmute failed' : 'Mute failed';
                    return;
                }
                sip.state.callMuted = muted;
            }
        };

        // terminates the call (SIP BYE or CANCEL)
        sip.hangup = function () {
            if (sip.sessionCall) {
                sip.sessionCall.hangup({events_listener: {events: '*', listener: onSipEventSession}});
            }
        };

        function startRingTone() {
            try {
                var ringtone = document.getElementById("ringtone");
                ringtone.play();
            }
            catch (e) {
            }
        }

        function stopRingTone() {
            try {
                var ringtone = document.getElementById("ringtone");
                ringtone.pause();
            }
            catch (e) {
            }
        }

        function startRingbackTone() {
            try {
                var ringbacktone = document.getElementById("ringbacktone");
                ringbacktone.play();
            }
            catch (e) {
            }
        }

        function stopRingbackTone() {
            try {
                var ringbacktone = document.getElementById("ringbacktone");
                ringbacktone.pause();
            }
            catch (e) {
            }
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

        // Callback function for SIP Stacks
        function onSipEventStack(e /*SIPml.Stack.Event*/) {
            console.log('==stack event== ', e);
            switch (e.type) {
                case 'starting':
                    sip.setState('message', "Starting...");
                    break;
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
                        sip.setState('errorMessage', e);
                    }
                    sip.setState('message', '');
                    sip.setState('registering', false);
                    sip.setState('registered', true);
                    break;
                }
                case 'stopping':
                    sip.setState('message', 'Stopping...');
                    break;
                case 'stopped':
                    sip.setState('message', '');
                    sip.setState('registering', false);
                    sip.setState('registered', false);
                    break;
                case 'failed_to_start':
                case 'failed_to_stop':
                {
                    sip.stack = null;
                    sip.sessionRegister = null;
                    sip.sessionCall = null;

                    stopRingbackTone();
                    stopRingTone();

                    sip.setState('errorMessage', "Disconnected: " + e.description);
                    sip.setState('registering', false);
                    sip.setState('registered', false);
                    break;
                }

                case 'i_new_call':
                {
                    if (sip.sessionCall) {
                        // do not accept the incoming call if we're already 'in call'
                        e.newSession.hangup(); // comment this line for multi-line support
                    }
                    else {
                        sip.setState('incomingCall', true);
                        sip.sessionCall = e.newSession;
                        // start listening for events
                        sip.sessionCall.setConfiguration(sip.configCall);

                        startRingTone();

                        var sRemoteNumber = (sip.sessionCall.getRemoteFriendlyName() || 'unknown');
                        sip.setState('callerName', sRemoteNumber);
                        sip.setState('callerNumber', sip.sessionCall.getRemoteUri().replace(/<|>/g, ''));
                    }
                    break;
                }

                case 'm_permission_requested':
                {
                    break;
                }
                case 'm_permission_accepted':
                case 'm_permission_refused':
                {
                    if (e.type == 'm_permission_refused') {
                        sip.setState('errorMessage', 'Media stream permission denied.');
                    }
                    break;
                }
                default:
                    break;
            }
        }

        // Callback function for SIP sessions (INVITE, REGISTER, MESSAGE...)
        function onSipEventSession(e /* SIPml.Session.Event */) {
            console.log('==session event==', e);
            switch (e.type) {
                case 'connecting':
                    sip.setState('message', 'Connecting...');
                    if (e.session == sip.sessionCall) {
                        //startRingbackTone();
                    }
                    break;
                case 'connected':
                {
                    if (e.session == sip.sessionRegister) { // registered
                        sip.setState('registering', false);
                        sip.setState('registered', true);
                    }
                    else if (e.session == sip.sessionCall) { // call connected
                        stopRingbackTone();
                        stopRingTone();

                        sip.setState('callConnected', true);
                        sip.setState('calling', false);
                        sip.startCallTimer();

                        if (SIPml.isWebRtc4AllSupported()) { // IE don't provide stream callback
                            uiVideoDisplayEvent(false, true);
                            uiVideoDisplayEvent(true, true);
                        }
                    }
                    sip.setState('message', '');
                    break;
                } // 'connecting' | 'connected'
                case 'terminating':
                {
                    // if (e.session == sip.sessionCall) {
                    //     sip.saveCurrentCallLog();
                    // }
                    sip.setState('message', "Terminating...");
                }
                case 'terminated':
                {
                    if (e.session == sip.sessionRegister) {
                        sip.sessionCall = null;
                        sip.sessionRegister = null;
                    }
                    else if (e.session == sip.sessionCall) {
                        sip.saveCurrentCallLog();
                        sip.stopCallTimer();
                        sip.sessionCall = null;
                        sip.setState('callConnected', false);
                        sip.setState('calling', false);
                        sip.setState('isCallOnHold', false);
                        sip.setState('callMuted', false);
                        sip.setState('incomingCall', false);
                        sip.setState('transferringCall', false);
                        sip.setState('callTransferred', false);
                        sip.setState('isCallOnHold', false);
                        sip.setState('isCallOnHoldByRemote', false);
                        sip.setState('callerName', '');
                        sip.setState('callerNumber', '');
                        stopRingbackTone();
                        stopRingTone();
                    }
                    sip.setState('message', e.description);
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
                        }
                    }
                    break;
                }

                case 'm_early_media':
                {
                    if (e.session == sip.sessionCall) {
                        // stopRingbackTone();
                        // stopRingTone();
                        //txtCallStatus.innerHTML = '<i>Early media started</i>';
                    }
                    break;
                }

                case 'm_local_hold_ok':
                {
                    if (e.session == sip.sessionCall) {
                        if (sip.sessionCall.bTransfering) {
                            sip.sessionCall.bTransfering = false;
                        }
                        sip.sessionCall.bHeld = true;
                        sip.setState('isCallOnHold', true);
                    }
                    break;
                }
                case 'm_local_hold_nok':
                {
                    if (e.session == sip.sessionCall) {
                        sip.sessionCall.bTransfering = false;
                        sip.setState('isCallOnHold', false);
                        sip.setState('errorMessage', 'Failed to place remote party on hold');
                    }
                    break;
                }
                case 'm_local_resume_ok':
                {
                    if (e.session == sip.sessionCall) {
                        sip.sessionCall.bTransfering = false;
                        sip.sessionCall.bHeld = false;
                        sip.setState('isCallOnHold', false);

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
                        sip.setState('errorMessage', 'Failed to resume call');
                    }
                    break;
                }
                case 'm_remote_hold':
                {
                    if (e.session == sip.sessionCall) {
                        sip.setState('isCallOnHoldByRemote', true);
                    }
                    break;
                }
                case 'm_remote_resume':
                {
                    if (e.session == sip.sessionCall) {
                        sip.setState('isCallOnHoldByRemote', false);
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
                        sip.setState('message', 'Call transfer in progress.');
                        sip.setState('transferringCall', true);
                        sip.setState('callTransferred', false);
                    }
                    break;
                }
                case 'o_ect_accepted':
                {
                    if (e.session == sip.sessionCall) {
                        sip.setState('transferringCall', false);
                        sip.setState('callTransferred', true);
                        sip.setState('message', 'Call transfer accepted.');
                    }
                    break;
                }
                case 'o_ect_completed':
                case 'i_ect_completed':
                {
                    if (e.session == sip.sessionCall) {
                        sip.setState('transferringCall', false);
                        sip.setState('callTransferred', true);
                        sip.setState('message', 'Call transfer completed.');
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
                        sip.setState('errorMessage', 'Call transfer failed: '+e.description);
                        sip.setState('transferringCall', false);
                        sip.setState('callTransferred', false);
                    }
                    break;
                }
                case 'o_ect_notify':
                case 'i_ect_notify':
                {
                    if (e.session == sip.sessionCall) {
                        if (e.getSipResponseCode() >= 300) {
                            if (sip.sessionCall.bHeld) {
                                sip.sessionCall.resume();
                            }
                        }
                    }
                    break;
                }
                case 'i_ect_requested':
                {
                    if (e.session == sip.sessionCall) {
                        var s_message = "Accept call transfer to [" + e.getTransferDestinationFriendlyName() + "]?";
                        if (confirm(s_message)) {
                            sip.setState('message', 'Call transfer in progress...');
                            sip.setState('transferringCall', true);
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