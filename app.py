from flask import Flask, render_template, session,request,url_for,redirect,jsonify
from flask_pymongo import PyMongo
from flask_socketio import SocketIO, join_room
from config import *
from random import randint
from bson.objectid import ObjectId
import requests
import os,shutil,os.path
from pdf2image import convert_from_path

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'pdf'}


#To run python file without re-running the flask command
def before_request():
    app.jinja_env.cache = {}
app.before_request(before_request)

#Mongo setup
app.config["MONGO_URI"] = MONGO_URI
print(MONGO_URI)
mongo = PyMongo(app)
print(mongo)
room='999'

def save(email,name):
    print(mongo.db)
    auth=mongo.db.auth
    pin=randint(100000, 999999)
    myquery = { "email": email }
    mydoc = auth.find(myquery)
    for x in mydoc:
        room=x['_id']
    try:
        x = room
        myquery = { "_id": room }
        newvalues = { "$set": { "pin": pin } }
        auth.update_one(myquery, newvalues)
        mongo.db.attendance.update_one(myquery,{"$set": { "attendance":[], "room":room }})

    except:
        auth.insert_one({"email": email,"pin":pin})
        mydoc = auth.find(myquery)
        for x in mydoc:
            room=x['_id']
            mongo.db.attendance.insert_one({"attendance":[], "room":room})

    response = requests.get("https://talk9api.herokuapp.com/auth?email="+str(email)+"&room="+str(room)+"&name="+str(name)+"&pin="+str(pin))
    return room

def check(room,pin):
    auth=mongo.db.auth
    myquery={"_id": ObjectId(room) }
    mydoc = auth.find_one(myquery)
    pin_real=mydoc['pin']
    print(pin_real)
    print(pin)
    return str(pin)==str(pin_real)

@app.route('/', methods =["GET", "POST"])
def home():
    if request.method == "POST":
        name = request.form.get("name")
        name=name.strip().replace(' ','-')
        email = request.form.get("email")
        email=email.strip()
        print(mongo.db)
        room=save(email,name)
        filename='./static/slides/'+str(room)
        try:
            shutil.rmtree(filename)
        except:
            pass
        os.mkdir(filename)
        os.mkdir(filename+'/pdf')
        os.mkdir(filename+'/img')
        if 'file' not in request.files:
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            shutil.rmtree(filename+'/img')
            shutil.copytree("./static/slides/demo", filename+'/img')
        if file and allowed_file(file.filename):
            file.save(filename+'/pdf/raw.pdf')
            images = convert_from_path(filename+'/pdf/raw.pdf')
            for i in range(len(images)):
                images[i].save(filename+'/img/'+str(i)+'.jpg','JPEG')
        return redirect(url_for('success'))
    return render_template('home.html')

@app.route('/len', methods =["GET", "POST"])
def query():
    room=request.args.get('room')
    path='./static/slides/'+str(room)+'/img'
    num_files = len([f for f in os.listdir(path)if os.path.isfile(os.path.join(path, f))])
    return jsonify({'n':num_files})

@app.route('/join', methods =["GET", "POST"])
def join():
    global room

    print(request.args)

    if request.method == "POST" :
        if request.form.get('room') is not None:
            room=request.form.get('room')
        name = request.form.get("name")
        name=name.strip().replace(' ','-')
        link='/console_panel?id=s&room='+room+'&name='+str(name)
        myquery = { "room": ObjectId(room) }
        mydoc = mongo.db.attendance.find_one(myquery)
        old=mydoc['attendance']
        if not name in old:
            old.append(name)

        mydoc['attendance']=old
        mongo.db.attendance.update_one(myquery,{"$set": { "attendance":old }})
        return redirect(link)
    return render_template('join.html')

@app.route('/nAuth')
def nAuth():
    return render_template('nAuth.html')

@app.route('/success')
def success():
    return render_template('success.html')

@app.route('/console_panel')
def console():
    i=request.args.get('id')
    room=request.args.get('room')
    if i == 't':
        pin=request.args.get('pin')
        if check(room,pin):
            return render_template('t_console.html')
        else:
            return redirect(url_for('nAuth'))
    if i == 's':
        return render_template('s_console.html')

@socketio.on('joined')
def on_join(data):
    username = data['name']
    room = data['room']
    join_room(room)
    myquery = { "room": ObjectId(room) }
    mydoc = mongo.db.attendance.find_one(myquery)

    socketio.emit('new_message',username + ' has entered the room.', to=room)
    if mydoc is not None:
        socketio.emit('attendance_update',mydoc['attendance'],to=room)
        print(mydoc, room)


@socketio.on('drawing')
def handle_my_custom_event(data):
    room=data['room']
    data=data['data']
    socketio.emit('drawing', data, to=room)

@socketio.on('page')
def handle_my_custom_event(data):
    room=data['room']
    data=data['data']
    socketio.emit('page', data, to=room)

@socketio.on("message")
def handleMessage(data):
    room=data['room']
    data=data['data']
    socketio.emit("new_message", data, to=room)

@socketio.on('radio')
def radio(blob):
    room=blob['room']
    blob=blob['blob']
    socketio.emit('voice', blob, to=room)

if __name__ == '__main__':
    socketio.run(app, debug=True)
