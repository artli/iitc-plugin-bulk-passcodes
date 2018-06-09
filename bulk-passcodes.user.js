// ==UserScript==
// @id             iitc-plugin-bulk-passcodes@artli
// @name           IITC plugin: Bulk passcode submission
// @version        0.0.1.20180610.2
// @author         https://github.com/artli
// @license        Apache License 2.0
// @category       Misc
// @namespace      https://github.com/artli/iitc-plugin-bulk-passcodes
// @description    Enable bulk passcode submission: if several passcodes are entered simultaneously, submit them consecutively with random delays
// @downloadURL    https://raw.githubusercontent.com/artli/iitc-plugin-bulk-passcodes/latestRelease/bulk-passcodes.user.js
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


var loader = function(pluginInfo) {
    var triggerRedeemInput = function(code) {
        $("#redeem").val(code);
        $("#redeem").trigger(
            $.Event('keypress', {which: $.ui.keyCode.ENTER}));
    };


    var redeemMany = function(codes) {
        var code = codes.pop();
        console.log("[bulk-passcodes] Redeeming " + code + " (" + codes.length + " left)");
        triggerRedeemInput(code);
        if (codes.length > 0) {
            var timeout = 2000 + 2500 * Math.random();
            setTimeout(redeemMany.bind(this, codes), timeout);
        }
    };


    var setup = function() {
        // Too hacky for my liking. In my defense, the IITC code doesn't leave many other options
        var originalPasscodeInputHandler = $._data($('#redeem').get(0), "events").keypress[0].handler;
        if (typeof originalPasscodeInputHandler !== "function") {
            console.error("[bulk-passcodes] Plugin setup failed: could not find the default handler for passcodes");
            return;
        }

        $("#redeem").keypress(function(e) {
            if ((e.keyCode ? e.keyCode : e.which) !== 13) return;

            var input = $(this).val();
            var codes = input.match(/\w+/g);
            if (codes.length > 1) {
                console.log("[bulk-passcodes] " + codes.length + " passcodes parsed: " + codes.join(", "));
                redeemMany(codes);
            } else if (codes.length == 1) {
                originalPasscodeInputHandler.call(this, e);
            }
        });

        $("#redeem").off("keypress", null, originalPasscodeInputHandler);

        console.log("[bulk-passcodes] Plugin successfully loaded")
    }


    setup.info = pluginInfo;
    if (window.iitcLoaded) {
        setup();
    }

    // Add the plugin to bootPlugins even if IITC has already booted:
    //   IITC uses bootPlugins to collect info about installed plugins
    if (!window.bootPlugins) {
        window.bootPlugins = [];
    }
    window.bootPlugins.push(setup);
}


var constructPluginInfo = function() {
    var pluginInfo = {};
    if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
        pluginInfo.script = {
            version: GM_info.script.version,
            name: GM_info.script.name,
            description: GM_info.script.description
        };
    }
    return pluginInfo;
}


// Inject plugin code into site context
var pluginInfo = constructPluginInfo();
var scriptText = '('+ loader + ')(' + JSON.stringify(pluginInfo) + ');';
var script = document.createElement('script');
script.appendChild(document.createTextNode(scriptText));
(document.body || document.head || document.documentElement).appendChild(script);
