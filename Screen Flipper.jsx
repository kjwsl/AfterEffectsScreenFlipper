var project = app.project;
var comp = project.activeItem;

var mainWindow = new Window("palette", "Screen Flipper");
mainWindow.orientation = "column";

mainWindow.add("statictext", undefined, "This is Screen Flipper for you YTPMVers!");
mainWindow.add("statictext", undefined, "Choose Your 'audio' Layer and 'video' Layer");

var parameterGroup = mainWindow.add("group", undefined, "parameterGroup");
parameterGroup.orientation = "column";

var thresholdGroup = parameterGroup.add("group", undefined, "tresholdGroup");
thresholdGroup.orientation = "row";
thresholdGroup.add("statictext", [0, 0, 100, 25], "Threshold");
var thresholdSlider = thresholdGroup.add("slider", undefined, 1, 0, 10);
var thresholdValue = thresholdGroup.add("statictext", undefined, thresholdSlider.value);
thresholdValue.size = [25, 25];
thresholdSlider.onChanging = function () {
    thresholdValue.text = thresholdSlider.value.toFixed(0);
}

var offsetGroup = parameterGroup.add("group", undefined, "offsetGroup");
offsetGroup.add("statictext", [0, 0, 100, 25], "Offset (Frames)");
var offsetSlider = offsetGroup.add("slider", undefined, 0, 0, 100);
var offsetValue = offsetGroup.add("statictext", undefined, offsetSlider.value)
offsetValue.size = [25, 25];
offsetSlider.onChanging = function () {
    offsetValue.text = offsetSlider.value.toFixed(0);
}

var speedGroup = parameterGroup.add("group", undefined, "speedGroup");
speedGroup.add("statictext", [0, 0, 100, 25], "Speed");
var speedSlider = speedGroup.add("slider", undefined, 1, 1, 5);
var speedValue = speedGroup.add("statictext", undefined, speedSlider.value)
speedValue.size = [25, 25];
speedSlider.onChanging = function () {
    speedValue.text = speedSlider.value.toFixed(0);
}

var isNotResetTimingCheckbox = mainWindow.add("checkbox", undefined, "Do Not Reset Timing");
var isNotFlipScreen = mainWindow.add("checkbox", undefined, "Do Not Flip Screen");



var buttonGroup = mainWindow.add("group", undefined, "buttonGroup");
var buttonStart = buttonGroup.add("button", undefined, "Start");

buttonStart.onClick = function () {
    validate();
    app.beginUndoGroup("Undo Flipping");

    var layers = separateAudioVideo();
    var keyInfo = getAudioInfo(layers.audioLayer);
    editVideo(layers.videoLayer, keyInfo.keyTimes, keyInfo.keyValues);

    alert("Complete", "Success!");
    mainWindow.close();
    app.endUndoGroup();
}

mainWindow.show();

function validate() {
    var curItem = project.activeItem;

    if (curItem.selectedLayers.length<2 || comp == null || !(comp instanceof CompItem)){
        alert("Please Select Your 'audio' Layer and 'video' Layout First")
    }
}

function editVideo(videoLayer, keyTimes, keyValues) {
    var counter = 0;
    var scale = videoLayer.transform.scale;
    var isRun = false;
    var scaleValue = scale.value;
    var startPoint = 0, endPoint = 0;
    var time = videoLayer("Time Remap");


    videoLayer.timeRemapEnabled = true;

    time.setValueAtTime(keyTimes[0], keyTimes[offsetSlider.value.toFixed(0)])

    for (var i = 0; i < keyTimes.length; i++) {
        if (keyValues[i] >= parseInt(thresholdValue.text) && !isRun) {
            isRun = true;
            if (keyTimes[i - 1] >= 0) {
                endPoint = keyTimes[i - 1];
                if (!isNotFlipScreen.value) {
                    scale.setValueAtTime(keyTimes[i - 1], scaleValue);
                }

                if (!isNotResetTimingCheckbox.value) {
                    time.setValueAtTime(keyTimes[i - 1], (endPoint - startPoint)*speedSlider.value.toFixed(0) + keyTimes[offsetSlider.value.toFixed(0)]);
                }
            }
            startPoint = keyTimes[i];
            counter++;
            if (!isNotFlipScreen.value) {
                scaleValue[0] = counter % 2 != 0 ? Math.abs(scale.value[0]) : -scale.value[0];
                scale.setValueAtTime(keyTimes[i], scaleValue);
            }

            if (!isNotResetTimingCheckbox.value) {
                time.setValueAtTime(keyTimes[i], keyTimes[offsetSlider.value.toFixed(0)]);
            }

        }
        else if (keyValues[i] <= parseInt(thresholdValue.text) && isRun) {
            isRun = false;
        }
    }
}

function getAudioInfo(audioLayer) {
    app.executeCommand(app.findMenuCommandId("Deselect All"));
    audioLayer.selected = true;
    app.executeCommand(app.findMenuCommandId("Convert Audio to Keyframes"));


    var keyValues = new Array();
    var keyTimes = new Array();
    var slider = comp.layer(1)("Effects")("Both Channels")("Slider");

    for (var i = 1; i <= slider.numKeys; i++) {
        keyTimes.push(slider.keyTime(i));
        keyValues.push(slider.keyValue(i));
    }

    comp.layer(1).remove();
    return { keyTimes: keyTimes, keyValues: keyValues };
}

function separateAudioVideo() {
    for (var i = 0; i < comp.selectedLayers.length; i++) {
        if (comp.selectedLayers[i].name == "audio") {
            var audioLayer = comp.selectedLayers[i];
        }
        else if (comp.selectedLayers[i].name == "source") {
            var videoLayer = comp.selectedLayers[i];
        }
        else {
            alert("Name your layers properly!");
        }
    }
    return { audioLayer: audioLayer, videoLayer: videoLayer };
}

