    $('#voice').on({
        'click': function(){
        ($('#mic').attr('src') === '/static/images/icons/voice-recorder.png')
                ? $('#mic').attr('src','/static/images/icons/voice-recorder-mute.png')
                : $('#mic').attr('src', '/static/images/icons/voice-recorder.png');;
        }
    })
