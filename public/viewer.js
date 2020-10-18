var token = "";
var tuid = "";
var ebs = "";
// because who wants to type this every time?
var twitch = window.Twitch.ext;

// create the request options for our Twitch API calls
var requests = {
    set: createRequest('POST', 'cycle'),
    get: createRequest('GET', 'query'),
    getPalettes : {
        type: 'GET',
        url: location.protocol + '//localhost:8081/color/palettes',
        success: updatePalettes,
        error: logError
    },
    getFx : {
        type: 'GET',
        url: location.protocol + '//localhost:8081/color/fx',
        success: updateFx,
        error: logError
    }
};

function createRequest(type, method) {

    return {
        type: type,
        url: location.protocol + '//localhost:8081/color/' + method,
        success: updateBlock,
        error: logError
    }
}  

function setAuth(token) {
    Object.keys(requests).forEach((req) => {
        twitch.rig.log('Setting auth headers');
        requests[req].headers = { 'Authorization': 'Bearer ' + token }
    });
}

twitch.onContext(function(context) {
    twitch.rig.log(context);
});

twitch.onAuthorized(function(auth) {
    // save our credentials
    token = auth.token;
    tuid = auth.userId;

    // enable the button
    $('#cycle').removeAttr('disabled');
    $('#palette-dropdown').removeAttr('disabled');
    $('#palette-dropdown').append('<option selected="true" disabled>Color Palette</option>');
    $('#palette-dropdown').prop('selectedIndex', 0);

    $('#fx-dropdown').removeAttr('disabled');
    $('#fx-dropdown').append('<option selected="true" disabled>Light Effect</option>');
    $('#fx-dropdown').prop('selectedIndex', 0);

    setAuth(token);
    $.ajax(requests.get);

    $.ajax(requests.getPalettes);
    $.ajax(requests.getFx);
});

function updateBlock(hex) {
    twitch.rig.log('Updating block color');
    $('#color').css('background-color', hex);
}

function updatePalettes(paletteList){
    palettes = JSON.parse(paletteList);
    //twitch.rig.log(palettes);

    $.each(palettes, function(key, value) {
        $('#palette-dropdown').append($('<option/>').attr("value", value.index).text(value.name));
    });
}

function updateFx(fxList){
    fx = JSON.parse(fxList);
    //twitch.rig.log(fx);

    $.each(fx, function(key, value) {
        $('#fx-dropdown').append($('<option/>').attr("value", value.index).text(value.name));
    });
}

function logError(_, error, status) {
  twitch.rig.log('EBS request returned '+status+' ('+error+')');
}

function logSuccess(hex, status) {
  // we could also use the output to update the block synchronously here,
  // but we want all views to get the same broadcast response at the same time.
  twitch.rig.log('EBS request returned '+hex+' ('+status+')');
}

$(function() {
    // when we click the cycle button
    $('#cycle').click(function() {
        if(!token) { return twitch.rig.log('Not authorized'); }
        twitch.rig.log('Requesting a color cycle');

        var paletteNum = $('#palette-dropdown').val();
        var fxNum = $('#fx-dropdown').val();

        twitch.rig.log('Sending palette #' + paletteNum + " FX #" + fxNum);

        data = {color: $(colorPicker).val(), palette: paletteNum, fx: fxNum};
        //data = {fx: $(fx-dropdown).val()};
        twitch.rig.log(data);
        requests['set'].data = data;
        $.ajax(requests.set);
    });

    // listen for incoming broadcast message from our EBS
    twitch.listen('broadcast', function (target, contentType, color) {
        twitch.rig.log('Received broadcast color');
        updateBlock(color);
    });
});
