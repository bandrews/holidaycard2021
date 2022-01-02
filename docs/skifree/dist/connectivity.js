var card = new ReconnectingWebSocket('ws://10.0.0.1:81/', ['arduino']);
    
card.onopen = function () {
    card.send('!connect');
    document.getElementById("reconnect").style.visibility = "hidden";

    document.dispatchEvent(new Event("cardConnect"));
};

card.onerror = function (error) {
    console.error('WebSocket Error ', error);
    document.getElementById("reconnect").style.visibility = "visible";
};

card.onclose = function (close) {
    document.getElementById("reconnect").style.display = "visible";
}

card.onmessage = function (e) {
    try {
        let message = JSON.parse(e.data);

        const dataReceived = new CustomEvent("card", {
            detail: message
        });

        console.log(message);
        document.dispatchEvent(dataReceived);
        //document.getElementById("status").innerHTML = Object.keys(message).map(key => "<tr><td>" + key + "</td><td>" + JSON.stringify(message[key]) + "</td></tr>").join('');
    }
    catch (ex) {
        console.log(e.data);
        console.log("Recevied unparseable message:  " + ex);
    }
};

function sendRGB(r, g, b, min, max) {
    msg = { command: "led" };
    msg.r = r;
    msg.g = g;
    msg.b = b;
    msg.min = min;
    msg.max = max;
    card.send(JSON.stringify(msg));
}

function setSendFreq(val) {
    msg = { command: "setSendInterval" };
    msg.sendInterval = val;
    card.send(JSON.stringify(msg));
    console.log(msg);
}

function join(ssid, key) {
    msg = {
        command: "joinwifi",
        ssid,
        key
    };
    card.send(JSON.stringify(msg));
}


window.addEventListener('message', function (e) {
    // Get the sent data
    const data = e.data;

    if (data === "hide")
    {
        card.close();
    }
    else if (data === "show")
    {
        card.reconnect();
    }

});