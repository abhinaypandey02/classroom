'use strict';

function clearInput() {
    document.getElementById("chat-input").value = "";
}

// String capitalization
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// main

(function() {

    var socket = io();
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const name = capitalize(urlParams.get('name'))
    const room = capitalize(urlParams.get('room'))
    var canvas = document.getElementsByClassName('whiteboard')[0];
    var prev = document.getElementById("prev");
    var next = document.getElementById("next");
    var clear = document.getElementById("clear");
    var voice = document.getElementById("voice");
    var send = document.getElementById("send");
    var whiteboard = document.getElementById("white");
    var context = canvas.getContext('2d');
    var voice_flag = false
    var current = {
        color: 'red'
    };
    var drawing = false;
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

    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
    canvas.addEventListener('touchstart', onMouseDown, false);
    canvas.addEventListener('touchend', onMouseUp, false);
    canvas.addEventListener('touchcancel', onMouseUp, false);
    canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);


    socket.emit("joined", {
        name: name,
        room: room
    })

    function getCursorElement(id) {
        var elementId = 'cursor-' + id;
        var element = document.getElementById(elementId);
        if (element == null) {
            element = document.createElement('div');
            element.id = elementId;
            element.className = 'cursor';
            // Perhaps you want to attach these elements another parent than document
            document.appendChild(element);
        }
        return element;
    }

    socket.on('draw_cursor', function (data) {
        var el = getCursorElement(data.id);
        el.style.x = data.line[0].x;
        el.style.y = data.line[0].y;
    })

    socket.on('draw_cursor', function (data) {
        io.emit('draw_cursor', { line: data.line, id: socket.id });
      });

    socket.on('drawing', onDrawingEvent);
    socket.on('page', onpage);
    window.addEventListener('resize', onResize, false);
    onResize();

    send.onclick = function() {
        socket.emit("message", {
            data: name + "(Admin) : " + document.getElementById("chat-input").value,
            room: room
        });
    }
    socket.on("new_message", (data) => {
        print(data)
        document.getElementById("chat").innerHTML += "<br>" + "<span class='messages' style='font-weight: 900;'>" + data + "</span>";
    })
    socket.on("attendance_update", (data) => {
        print(data)
        data.forEach(x=> {
            console.log(x)
            document.getElementById("attendance").innerHTML += "<br>" + "<span class='messages' style='font-weight: 900;'>" + x + "</span>"
        })

    })

    function drawLine(x0, y0, x1, y1, color, emit) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.stroke();
        context.closePath();

        if (!emit) {
            return;
        }
        var w = canvas.width;
        var h = canvas.height;

        socket.emit('drawing', {
            data: {
                x0: x0 / w,
                y0: y0 / h,
                x1: x1 / w,
                y1: y1 / h,
                color: color
            },
            room: room
        });
    }

    function onMouseDown(e) {
        drawing = true;
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
    }

    function onMouseUp(e) {
        if (!drawing) {
            return;
        }
        drawing = false;
        drawLine(current.x, current.y, e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY, current.color, true);
    }

    function onMouseMove(e) {
        if (!drawing) {
            return;
        }
        drawLine(current.x, current.y, e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY, current.color, true);
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
    }


    // limit the number of events per second
    function throttle(callback, delay) {
        var previousCall = new Date().getTime();
        return function() {
            var time = new Date().getTime();

            if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }

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
    clear.onclick = function() {
        socket.emit('page', {
            data: {
                val: 'clear',
                p: pos
            },
            room: room
        })
    }
    prev.onclick = function() {
        socket.emit('page', {
            data: {
                val: 'prev',
                p: pos
            },
            room: room
        })
    }
    next.onclick = function() {
        socket.emit('page', {
            data: {
                val: 'next',
                p: pos
            },
            room: room
        })
    }
    whiteboard.onclick = function() {
        socket.emit('page', {
            data: {
                val: 'white',
                p: pos,
                flag: white_key
            },
            room: room
        })
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
            pos = max - 1
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

    socket.emit('page', {
        data: {
            val: 'clear',
            p: pos
        },
        room: room
    })


    var constraints = {
        audio: true
    };
    navigator.mediaDevices.getUserMedia(constraints).then(function(mediaStream) {
        var mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.onstart = function(e) {
            this.chunks = [];
        };
        mediaRecorder.ondataavailable = function(e) {
            this.chunks.push(e.data);
        };
        mediaRecorder.onstop = function(e) {
            var blob = new Blob(this.chunks, {
                'type': 'audio/ogg; codecs=opus'
            });
            socket.emit('radio', {
                blob: blob,
                room: room
            });
        };
        voice.onclick = function() {
            if (voice_flag == false) {
                mediaRecorder.start();
                var myVar = setInterval(function() {
                    try {
                        mediaRecorder.stop();
                        mediaRecorder.start();
                    } catch (err) {}
                }, 200);
                voice_flag = true;
            } else {
                mediaRecorder.stop();
                clearInterval(myVar);
                voice_flag = false;
            }
        }
    });

    //make the canvas fill its parent
    function onResize() {
        canvas.width = canvas.getBoundingClientRect().width;
        canvas.height = canvas.getBoundingClientRect().height;
        //clearf();
        socket.emit('page', {
            data: {
                val: 'clear',
                p: pos
            },
            room: room
        })
    }
})();
