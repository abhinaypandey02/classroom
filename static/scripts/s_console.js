'use strict';


(function() {
    const scale = 1
    var socket = io();
    let video = document.getElementById("video");
    let model;
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const name = urlParams.get('name')
    const room = urlParams.get('room')
    var canvas = document.getElementsByClassName('whiteboard')[0];
    var prev = document.getElementById("prev");
    var next = document.getElementById("next");
    var clear = document.getElementById("clear");
    var voice = document.getElementById("voice");
    var send = document.getElementById("send");
    var context = canvas.getContext('2d');
    var background = new Image();
    background.src = "static/slides/" + room + "/img/0.jpg";
    var pos = 0;
    var max;
    const Http = new XMLHttpRequest();
    const url = '/len?room=' + room;
    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange = (e) => {
        var res = JSON.parse(Http.responseText);
        max = res.n;
    }
    var white_key = false;
    var current = {
        color: 'red'
    };
    var drawing = false;

    socket.on('voice', function(arrayBuffer) {
        var blob = new Blob([arrayBuffer], {
            'type': 'audio/ogg; codecs=opus'
        });
        var audio = document.createElement('audio');
        audio.src = window.URL.createObjectURL(blob);
        audio.play();
    });



    socket.emit("joined", {
        name: name,
        room: room
    })
    socket.on('drawing', onDrawingEvent);
    socket.on('page', onpage);
    window.addEventListener('resize', onResize, false);
    onResize();

    send.onclick = function() {
        socket.emit("message", {
            data: name + " : " + document.getElementById("chat-input").value,
            room: room
        });
    }
    socket.on("new_message", (data) => {
        document.getElementById("chat").innerHTML += "<br>" + data;
    })
    socket.on("attendance_update", (data) => {
        print(data)
        data.forEach(x=> {
            console.log(x)
            document.getElementById("attendance").innerHTML += "<br>" + "<span class='messages'>" + x + "</span>"
        })

    })
    function drawLine(x0, y0, x1, y1, color) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.stroke();
        context.closePath();
    };



    function onDrawingEvent(data) {
        var w = canvas.width;
        var h = canvas.height;
        drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    }

    function onpage(data) {
        pos = data.p;
        white_key = !data.flag
        if (data.val == 'clear') {
            clearf();
        }
        if (data.val == 'next') {
            nextf();
        }
        if (data.val == 'prev') {
            prevf();
        }
        if (data.val == 'white') {
            white();
        }
    }

    background.onload = function() {
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
    }

    function clearf() {
        background.src = "static/slides/" + room + "/img/" + pos.toString() + ".jpg";
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
    };

    function nextf() {
        pos++;
        if (pos >= max) {
            pos = 0;
        }
        background.src = "static/slides/" + room + "/img/" + pos.toString() + ".jpg";
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
    };

    function prevf() {
        pos--;
        if (pos < 0) {
            pos = max - 1;
        }
        background.src = "static/slides/" + room + "/img/" + pos.toString() + ".jpg";
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
    };

    function white() {
        if (!white_key) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            background.src = "static/slides/" + room + "/img/" + pos.toString() + ".jpg";
            context.drawImage(background, 0, 0, canvas.width, canvas.height);
        }
    };


    const setupCamera = () => {
        navigator.mediaDevices.getUserMedia({
                video: {
                    width: 400,
                    height: 400
                },
                audio: false,
            })
            .then((stream) => {
                video.srcObject = stream;
            });
    };
    let previous = 1;
    let alpha;
    const detectFaces = async () => {
        const prediction = await model.estimateFaces(video, false);
        var flag = 0;
        if (prediction.length > 0 && prediction[0].probability > 0.9) {
            flag = 1;
        }
        alpha = flag - previous;
        previous = flag;
        if (alpha == -1) { //went away
            socket.emit("message", {
                data: "AI-bot : " + name + " Went Away!",
                room: room
            });
        }
        if (alpha == 1) { //come in
            socket.emit("message", {
                data: "AI-bot : " + name + " Resumed Watching!",
                room: room
            });
        }

        var ratio = canvas.height / (6 * 400)
        context.drawImage(video, 0, 0, canvas.height / 6, canvas.height / 6);
        prediction.forEach((pred) => {
            context.beginPath();
            context.lineWidth = "4";
            context.strokeStyle = "green";
            context.rect(0, 0, canvas.height / 6, canvas.height / 6);
            context.stroke();
            context.fillStyle = "red";
            pred.landmarks.forEach((landmark) => {
                if (landmark[0] < 350 && landmark[1] < 350) {
                    context.fillRect(landmark[0] * ratio, landmark[1] * ratio, 5, 5)
                }
            });
        });
    }

    setupCamera();
    video.addEventListener("loadeddata", async () => {
        model = await blazeface.load();
        setInterval(detectFaces, 150);
    });

    function float2int(value) {
        return value | 0;
    }

    //make the canvas fill its parent
    function onResize() {
        canvas.width = canvas.getBoundingClientRect().width;
        canvas.height = canvas.getBoundingClientRect().height;
        clearf();
    }

})();
