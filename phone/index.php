<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta id="csrf-token" name="csrf-token" content="b0NYIkaZUeUHkvzUz7qyDdst2bdxRJZi7aJ9ojPX">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title> | River Network</title>
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
    <link rel="stylesheet" href="/assets/administrator/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="/vendors/font-awesome-4.7.0/css/font-awesome.min.css">
    <link type="text/css" rel="stylesheet"
          href="/assets/administrator/bootstrap/css/ionicons.min.css">
    <link type="text/css" rel="stylesheet" href="/assets/administrator/dist/css/AdminLTE.min.css">
    <link type="text/css" rel="stylesheet"
          href="/assets/administrator/dist/css/skins/skin-blue.min.css">
    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->

    <link rel="stylesheet" href="/assets/administrator/bootstrap/css/jquery.dataTables.min.css">
    <link rel="stylesheet" href="/assets/css/common.css">
    <style>
        .main-header > .navbar {
            margin-left: 370px;
        }

        .main-header .logo {
            width: 370px;
        }

        .main-footer {
            margin-left: 0;
        }

        .main-header .logo {
            font-family: 'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        body {
            background-color: #ecf0f5;
        }

        .label {
            padding: 0;
            font-size: inherit;
            color: inherit;
            text-align: inherit;
            border-radius: 0;
        }

        .navbar-nav > .notifications-menu > .dropdown-menu > li .menu, .navbar-nav > .messages-menu > .dropdown-menu > li .menu, .navbar-nav > .tasks-menu > .dropdown-menu > li .menu {
            max-height: 600px;
        }
    </style>
    <style>
        #wrap-timer {
            font-size: 2.25em;
            position: fixed;
            right: 0;
            top: 0;
            padding: 0 0.5em;
            z-index: 9999;
            border-radius: 0 0 0 0.125em;
            background-color: rgba(255, 255, 255, 0.9);
            box-shadow: 0 0 10px;
        }

        hr {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
        }

        .heading {
            padding-top: 0.1em;
        }

        .logout-panel label {
            font-weight: bold;
        }

        .logout-panel {
            min-height: 0;
        }

        .page-name {
            padding-top: 10px;
        }

        label {
            cursor: pointer;
        }

        .form-group.has-checkbox {
            margin-bottom: 0;
            margin-top: 30px;
        }
    </style>
    <style>
        .phone-number {
            padding-top: 0.5em;
        }

        .phone-number .phone-input {
            width: 80%;
            float: left;
        }

        .phone-number .call-btn {
            display: block;
            width: 9.5%;
            float: left;
            margin-left: 0.5%;
        }

        .caller-info {
            margin-top: 1em;
            background-color: #252525;
            padding: 1em;
            color: #fff;
        }

        .caller-info .caller-img .fa {
            font-size: 12em;
        }

        .caller-info .caller-name {
            font-size: 1.4em;
        }

        .caller-info .hangup-btn {
            color: #e51323;
            cursor: pointer;
        }

        .caller-info .call-duration {
            font-size: 1.2em;
        }

        .caller-info .caller-img {
            width: 70%;
            margin: 0 auto;
            padding: 2em 0;
            color: #fff;
            background-color: #abd4e3;
        }
    </style>
    <script src="/vendors/custom-js/myFunctions.js"></script>
    <script src="/assets/administrator/plugins/jQuery/jQuery-2.1.4.min.js"></script>
    <script src="/assets/administrator/bootstrap/js/bootstrap.min.js"></script>
    <script src="/assets/administrator/dist/js/app.min.js"></script>
    <script src="/assets/administrator/bootstrap/js/jquery.dataTables.min.js"></script>
    <script src="/assets/js/angular.min.js"></script>

    <link rel="stylesheet" href="/vendors/angular-toaster/toaster.min.css">
    <script src="/vendors/angular-toaster/toaster.min.js"></script>

    <script src="/vendors/ui-bootstrap/ui-bootstrap-tpls-1.3.2.min.js"></script>

    <link rel="stylesheet" href="/vendors/angular-xeditable/xeditable.min.css"/>
    <script src="/vendors/angular-xeditable/xeditable.min.js"></script>

    <script src="/assets/js/underscore.js"></script>
    <script src="//js.pusher.com/3.0/pusher.min.js"></script>
    <script src="//cdn.jsdelivr.net/angular.pusher/latest/pusher-angular.min.js"></script>

    <script src="/vendors/angular-custom/angular-custom.js"></script>
    <script src="SIPml-api.js?svn=251" type="text/javascript"></script>
    <script src="app.js" type="text/javascript"></script>
    <script src="sipml5-service.js" type="text/javascript"></script>
    <link rel="stylesheet" href="style.css">

</head>
<body class="hold-transition skin-blue sidebar-mini">
<div class="main-wrapper" ng-app="myApp" ng-controller="MainController" ng-cloak>
    <div class="content-wrapper" style="margin: 1em 1em 0 1em">
        <div class="row">
            <div class="col-sm-4">
                <div class="box box-primary">
                    <div class="box-body phone-container">
                        <uib-tabset active="activeTab">
                            <uib-tab index="0">
                                <uib-tab-heading><i class="fa fa-phone"></i></uib-tab-heading>
                                <?php require_once 'phone.php'?>
                            </uib-tab>
                            <uib-tab index="1">
                                <uib-tab-heading><i class="fa fa-history"></i></uib-tab-heading>
                                <h4>Calls history / stats go here...</h4></uib-tab>
                        </uib-tabset>
                    </div>
                </div>
            </div>
            <div class="col-sm-4">
                <!--
  "registered": true,
  "calling": false,
  "callConnected": false,
  "callDuration": 0,
  "callFailed": false,
  "transferringCall": false,
  "callTransferred": false,
  "isCallOnHold": false,
  "isCallOnHoldByRemote": false,
  "callMuted": false,
  "incomingCall": false,
  "callerName": "",
  "callerNumber": "",
  "fullScreen": false
                -->
                <label>Agent Ext: <input ng-model="agent.ext"></label><br>
                <label>Agent Name: <input ng-model="agent.name"></label><br>
                <button ng-click="init()">Init</button>
                <button ng-click="register()">Register</button>
                <label>Registered: <input type="checkbox" ng-model="sipml5.state.registered" checked></label><br>
                <label>Incoming: <input type="checkbox" ng-model="sipml5.state.incomingCall"></label><br>
                <label>Connected: <input type="checkbox" ng-model="sipml5.state.callConnected"></label><br>
                <label>Calling: <input type="checkbox" ng-model="sipml5.state.calling"></label><br>
                <button ng-click="sipml5.startCallTimer()">Start Call Timer</button>
                <button ng-click="sipml5.stopCallTimer()">Stop Call Timer</button>
            </div>
            <div class="col-sm-4">
                <pre>{{sipml5.state | json}}</pre>
                <pre>{{sipml5.stackConfig | json}}</pre>
            </div>
        </div>
    </div>
</div>
</body>
</html>
