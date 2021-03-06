var websock;
var utcSeconds;

function listCONF(obj) {
    document.getElementById("adminpass").value = obj.auth_pass;
    document.getElementById("hstname").value = obj.wifi_hostname;
    document.getElementById("sdss").value = obj.sd_ss;
    document.getElementById("logging").value = obj.create_log;
    document.getElementById("rfidss").value = obj.rfid_ss;
    document.getElementById("gain").value = obj.rfid_gain;
    document.getElementById("gpiorly").value = obj.relay_gpio;
    document.getElementById("typerly").value = obj.relay_type;
    document.getElementById("delay").value = obj.relay_time;
    document.getElementById("apssid").value = obj.ap_ssid;
    document.getElementById("appass").value = obj.ap_pass;
    document.getElementById("stassid").value = obj.sta_ssid;
    document.getElementById("stapass").value = obj.sta_pass;
    document.getElementById("ntpserver").value = obj.ntpserver;
    document.getElementById("intervals").value = obj.ntpinterval;
    document.getElementById("DropDownTimezone").value = obj.timezone;
    if (obj.wifimode === "1") {
        document.getElementById("wifimodeap").checked = true;
    } else {
        document.getElementById("wifibssid").value = obj.sta_bssid;
        document.getElementById("hideBSSID").style.display = "block";
    }
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
    var dlAnchorElem = document.getElementById("downloadSet");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "esp-rfid-settings.json");
}

function browserTime() {
    var today = new Date();
    document.getElementById("rtc").innerHTML = today;
}

function deviceTime() {
    var t = new Date(0); // The 0 there is the key, which sets the date to the epoch
    t.setUTCSeconds(utcSeconds);
    var d = t.toUTCString();
    document.getElementById("utc").innerHTML = d;
    utcSeconds = utcSeconds + 1;
}

var t = setInterval(browserTime, 1000);
var tt = setInterval(deviceTime, 1000);

function syncBrowserTime() {
    var d = new Date();
    var timestamp = Math.floor((d.getTime() / 1000) + ((d.getTimezoneOffset() * 60) * -1));
    var datatosend = {};
    datatosend.command = "settime";
    datatosend.epoch = timestamp;
    websock.send(JSON.stringify(datatosend));
    location.reload();
}

function handleAP() {
    document.getElementById("hideBSSID").style.display = "none";
}

function handleSTA() {
    document.getElementById("hideBSSID").style.display = "block";
}

function listSSID(obj) {
    var select = document.getElementById("ssid");
    for (var i = 0; i < obj.ssid.length; i++) {
        var opt = document.createElement("option");
        opt.value = obj.ssid[i];
        opt.innerHTML = obj.ssid[i];
        opt.bssidvalue = obj.bssid[i];
        select.appendChild(opt);
    }
    document.getElementById("scanb").innerHTML = "Re-Scan";
}

function listBSSID(obj) {
    var select = document.getElementById("ssid");
    document.getElementById("wifibssid").value = select.options[select.selectedIndex].bssidvalue;
}

function scanWifi() {
    websock.send("{\"command\":\"scan\"}");
    document.getElementById("scanb").innerHTML = "...";
    document.getElementById("stassid").style.display = "none";
    var node = document.getElementById("ssid");
    node.style.display = "inline";
    while (node.hasChildNodes()) {
        node.removeChild(node.lastChild);
    }
}

function saveConf() {
    var adminpass = document.getElementById("adminpass").value;
    if (adminpass === null || adminpass === "") {
        alert("Administrator Password cannot be empty");
        return;
    }
    var ssid;
    if (document.getElementById("stassid").style.display === "none") {
        var b = document.getElementById("ssid");
        ssid = b.options[b.selectedIndex].value;
    } else {
        ssid = document.getElementById("stassid").value;
    }
    var datatosend = {};
    var wifimode = "0";
    datatosend.command = "configfile";
    datatosend.auth_pass = adminpass;
    datatosend.wifi_hostname = document.getElementById("hstname").value;
    datatosend.sd_ss = document.getElementById("sdss").value;
    datatosend.create_log = document.getElementById("logging").value;
    datatosend.rfid_ss = document.getElementById("rfidss").value;
    datatosend.rfid_gain = document.getElementById("gain").value;
    datatosend.relay_gpio = document.getElementById("gpiorly").value;
    datatosend.relay_type = document.getElementById("typerly").value;
    datatosend.relay_time = document.getElementById("delay").value;
    datatosend.ap_ssid = document.getElementById("apssid").value;
    datatosend.ap_pass = document.getElementById("appass").value;
    datatosend.sta_ssid = ssid;
    datatosend.sta_pass = document.getElementById("stapass").value;
    if (document.getElementById("wifimodeap").checked) {
        wifimode = "1";
        datatosend.sta_bssid = document.getElementById("wifibssid").value = 0;
    } else {
        datatosend.sta_bssid = document.getElementById("wifibssid").value;
    }
    datatosend.wifimode = wifimode;
    datatosend.ntpserver = document.getElementById("ntpserver").value;
    datatosend.ntpinterval = document.getElementById("intervals").value;
    datatosend.timezone = document.getElementById("DropDownTimezone").value;
    websock.send(JSON.stringify(datatosend));
    location.reload();
}

function testRelay() {
    websock.send("{\"command\":\"testrelay\"}");
}

function backupuser() {
    websock.send("{\"command\":\"picclist\"}");
}

function backupset() {
    var dlAnchorElem = document.getElementById("downloadSet");
    dlAnchorElem.click();
}

function piccBackup(obj) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
    var dlAnchorElem = document.getElementById("downloadUser");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "esp-rfid-users.json");
    dlAnchorElem.click();
}

function restoreSet() {
    var input = document.getElementById("restoreSet");
    var reader = new FileReader();
    if ("files" in input) {
        if (input.files.length === 0) {
            alert("You did not select file to restore");
        } else {
            reader.onload = function () {
                var json;
                try {
                    json = JSON.parse(reader.result);
                } catch (e) {
                    alert("Not a valid backup file");
                    return;
                }
                if (json.command === "configfile") {
                    var x = confirm("File seems to be valid, do you wish to continue?");
                    if (x) {
                        websock.send(JSON.stringify(json));
                        alert("Device now should reboot with new settings");
                        location.reload();
                    }
                }
            };
            reader.readAsText(input.files[0]);
        }
    }
}

function restoreUser() {
    var input = document.getElementById("restoreUser");
    var reader = new FileReader();
    if ("files" in input) {
        if (input.files.length === 0) {
            alert("You did not select any file to restore");
        } else {
            reader.onload = function () {
                var json;
                try {
                    json = JSON.parse(reader.result);
                } catch (e) {
                    alert("Not a valid backup file");
                    return;
                }
                if (json.command === "picclist") {
                    var x = confirm("File seems to be valid, do you wish to continue?");
                    if (x) {
                        document.getElementById("pbar").style.display = "block";
                        var len = json.piccs.length;
                        for (var i = 1; i <= len; i++) {
                            var uid = json.piccs[i - 1].slice(3);
                            var user = json.users[i - 1];
                            var acc = json.accType[i - 1];
                            var timed = json.timedAcc[i - 1];
                            var validdate = json.validDate[i - 1];
                            restore1by1(i, uid, user, acc, timed, validdate, len);
                        }
                    }
                }
            };
            reader.readAsText(input.files[0]);
        }
    }
}

function restore1by1(n, uid, user, acc, timed, validdate, len) {
    setTimeout(function () {
        var datatosend = {};
        datatosend.command = "userfile";
        datatosend.uid = uid;
        datatosend.user = user;
        datatosend.accType = acc;
        datatosend.timedAcc = timed;
        datatosend.validDate = validdate;
        websock.send(JSON.stringify(datatosend));
        var elem = document.getElementById("dynamic");
        var part = 100 / len;
        elem.style.width = part * n + "%";
        if (n === len) {
            document.getElementById("dynamic").innerHTML = "Completed";
        }
    }, 200 * n);
}

function refreshStats() {
    websock.send("{\"command\":\"status\"}");
}

function listStats(obj) {
    document.getElementById("chip").innerHTML = obj.chipid;
    document.getElementById("cpu").innerHTML = obj.cpu + " Mhz";
    document.getElementById("heap").innerHTML = obj.heap + " Bytes";
    document.getElementById("heap").style.width = (obj.heap * 100) / 81920 + "%";
    colorStatusbar(document.getElementById("heap"));
    document.getElementById("flash").innerHTML = obj.availsize + " Bytes";
    document.getElementById("flash").style.width = (obj.availsize * 100) / 1044464 + "%";
    colorStatusbar(document.getElementById("flash"));
    document.getElementById("spiffs").innerHTML = obj.availspiffs + " Bytes";
    document.getElementById("spiffs").style.width = (obj.availspiffs * 100) / obj.spiffssize + "%";
    colorStatusbar(document.getElementById("spiffs"));
    document.getElementById("ssidstat").innerHTML = obj.ssid;
    document.getElementById("ip").innerHTML = obj.ip;
    document.getElementById("gate").innerHTML = obj.gateway;
    document.getElementById("mask").innerHTML = obj.netmask;
    document.getElementById("dns").innerHTML = obj.dns;
    document.getElementById("mac").innerHTML = obj.mac;
}

function colorStatusbar(ref) {
    var percentage = ref.style.width.slice(0, -1);
    if (percentage > 50) ref.className = "progress-bar progress-bar-success";
    else if (percentage > 25) ref.className = "progress-bar progress-bar-warning";
    else ref.class = "progress-bar progress-bar-danger";
}

function clearLog() {
    websock.send("{\command\":\"clearlog\"}");
    var x = confirm("This will remove all logs. Are you sure?");
    if (x) {
        //var jsontosend = "{\"uid\":\"" + e.id + "\",\"command\":\"remove\"}";
        //websock.send(jsontosend);
    }
}

function start() {
    websock = new WebSocket("ws://" + window.location.hostname + "/ws");
    websock.onopen = function (evt) {
        websock.send("{\"command\":\"getconf\"}");
        websock.send("{\"command\":\"gettime\"}");
        websock.send("{\"command\":\"status\"}");
        document.getElementById("loading-img").style.display = "none";
    };
    websock.onclose = function (evt) {};
    websock.onerror = function (evt) {
        console.log(evt);
    };
    websock.onmessage = function (evt) {
        var obj = JSON.parse(evt.data);
        if (obj.command === "ssidlist") {
            listSSID(obj);
        } else if (obj.command === "configfile") {
            listCONF(obj);
        } else if (obj.command === "gettime") {
            utcSeconds = obj.epoch;
        } else if (obj.command === "picclist") {
            piccBackup(obj);
        } else if (obj.command === "status") {
            listStats(obj);
        }
    };
}