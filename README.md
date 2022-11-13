# CLASSROOM-X
"Low-Bandwidth AI Teaching Platform for overcoming internet access inequity"

## Problem-Statement
**Slow Internet** Connections or **Limited Access** From Homes in Rural/Hilly/Remote Areas Can Contribute to Students Falling Behind Academically During Online-Era in The Prevailing COVID-Setups, According to a New Report From Michigan State University’s Quello Center.

## Our-Hack
**A Robust E-Classroom Platform With Lowest Data-Transmission Leveraging on AI for Overcoming the Internet Access Inequity**
Our Approach Was to Take Shortest Path Instead of Fastest Vehicle , So Instead of Direct Streaming We Regenerated Teacher's Screen on Student Console With Bare-Minimum Data-Streaming and Client-Side AI Monitoring Students Presence.

[Presentation-Slides](https://www.canva.com/design/DAEo8kwPtWA/tBKAYxaME1bK1KaY4bfaOA/view?utm_content=DAEo8kwPtWA&utm_campaign=designshare&utm_medium=link&utm_source=publishpresent)

[Presentation-Video](https://youtu.be/7qw1-N-txkM)

## Achievement
**Able to Operate at 8 Kbps Speed With 28.8 Mb Hourly Data Consumption** as Compared to Google Meet With Requirements of 90 Kbps Speed & 324 Mb/hour.

## Data-Transmitted
- PDF -ANNOTATION
    - STATIC : PDF WHILE PAGE LOADS INITIALLY
    - DYNAMIC : PAGE_NO , COORDINATES_ANNOTATION
- WHITEBOARD
    - DYNAMIC : COORDINATES_ANNOTATION , CLEAR_FLAG
- AUDIO-CHANNEL
    - DYNAMIC : VOICE_BULB
- CHAT-ROOM:
    - DYNAMIC : TEXT
- SYSTEM:
    - DYNAMIC : ROOM_ID , MODE
- MONITOR-STUDENTS:
    - DYNAMIC : NONE
    - CLIENT-SIDE AI MODEL MONITORS STUDENTS THROUGH WEB-CAM AND ALERTS THE TEACHER ABOUT STUDENT'S PRESENCE.

## Technologies Used
- **Backend:**
    - Python/Flask
    - Socket.io
- **Frontend:**
    - HTML/CSS/JS
    - JQuery/Bootstrap
    - Tensorflow.js
        - BlazeFace
- **Database:**
    - MongoDB
- **Deployment:**
    - Heroku

## Configuration
Create a `.env` file in the folder.
>Note: Make sure that `.env` file is at the same place where `app.py` exists.

Then, enter your **MONGO_URI** there:
```sh
MONGO_URI= **Your Mongo URi**
```

## Installation
Install the Dependencies and devDependencies first:

```sh
pip install -r requirements.txt
flask run
```
