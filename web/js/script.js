const print = console.log

let tagTextElements = null;

// show copy toast
const copyBtn = document.querySelector(".copy-tags-btn");
const copyToast = document.querySelector(".copied-toast");
const selectAllbtn = document.querySelector(".selectall-tags-btn");

//select all the elements with the tag-selected class so that you can copy the ones only that the user selected
selectAllbtn.addEventListener("click", function () {
    tagTextElements.forEach(function (tag) {
        if (!(tag.classList.contains("tag-selected"))) {
            tag.classList.add("tag-selected");
            tag.classList.add("bg-red-500");
            tag.classList.toggle("text-white");
            tag.classList.toggle("text-zinc-50");
        }
    })
});

// animate toast on click
copyBtn.addEventListener("click", function () {
    let tags = document.querySelectorAll(".tag-selected");
    if (tags.length > 0) {
        copyToast.children[0].innerHTML = "copied";

        let ytTagsArr = [];
        tags.forEach(function (ytTag) {
            ytTagsArr.push(ytTag.innerText);
        })
        console.log(ytTagsArr.join(", "));
        navigator.clipboard.writeText(ytTagsArr.join(", "));
    } else {
        copyToast.children[0].innerHTML = "select tags!";
    }

    copyToast.classList.remove("hidden");
    copyToast.classList.add("show");
    copyToast.classList.remove("hide");

    setTimeout(function () {
        copyToast.classList.add("hide");
        copyToast.classList.remove("show")
    }, 1000);
})


// go btn
const go = document.querySelector("#submit-btn");
// audio card
const audioDetailsCard = document.querySelector(".audio-details-card");
// tags card
const tagsCard = document.querySelector(".tags-card")

// ui elements
// thumbnail element
const audioDisplayThumb = document.querySelector("#yt-audio-display-thumb");
// save thumbnail link <a>
const audioSaveThumb = document.querySelector("#yt-audio-save-thumb");
// yt title audio
const audioYTTitle = document.querySelector("#yt-audio-title");
// yt duration audio
const audioYTDuration = document.querySelector("#yt-audio-duration");
// this function checks if the show-tags is checked if checked then it shows the tags-card
const showTags = document.querySelector("#show-tags");


// when user clicks the go btn.... adding click event listener
go.addEventListener("click", function () {
    // select the user selected radio button video/audio/tags
    const selectedOption = document.querySelector("input[name='option']:checked");

    // select the yt url input element
    const yt_video_url = document.querySelector("#yt-url-input");

    if (selectedOption === null) {
        pingMessage("please select an option video/mp3/tags");
        return
    }

    // check if the url is entered!
    if (!(yt_video_url.checkValidity())) {
        pingMessage("please enter an youtube link")
        return
    }

    console.log(selectedOption)
    // implementing switch case
    switch (Number(selectedOption.value)) {
        // Case Download Audio
        case 2:
            if (!(tagsCard.classList.contains("hidden"))) {
                tagsCard.classList.add("hidden");
            }
            // this function handles audio downloading
            executeDownloadAudio(yt_video_url);
            break;
        // Case Extract Tags
        case 3:
            resetAudioCard()
            print("extract tags")
            extractTags(yt_video_url.value)
            break;
    }
});

eel.expose(updateAudioProgress)
function updateAudioProgress(percent) {
    document.querySelector(".audio-progress-bar").style.width = parseFloat(percent) + "%";
    document.querySelector(".audio-download-percentage").innerText = percent
    if (percent === "100.0%") {
        document.querySelector(".audio-progress-bar").style.width = "100%";
        document.querySelector(".audio-download-percentage").innerText = "Please Wait Processing";
    }
}

// handles downloading audio (calling py func to fetch details and download audio)
async function executeDownloadAudio(yt_video_url) {
    // this function takes the selected option and does all the checks and logs out the error and also calls the function for downloading to python
    // if none of the radio btns are checked then alert the user setting time out for 3 secs for alert

    // check if the yt url is entered and send the yt-url and the radio value (1-video, 2-mp3, 3-tags) to python
    if (yt_video_url.checkValidity()) {

        // while the python is fetching the details remove the hidden from the card and add animate-pulse so that it imitates loading...
        audioDetailsCard.classList.remove("hidden");
        audioDetailsCard.classList.add("animate-pulse", "interactions-disabled");

        btnBeforeLoading();
        let audioDetails = await eel.get_audio_details(yt_video_url.value)();
        if (!(audioDetails.status_code === 200)) {
            pingMessage("Please check your connection & try again later", 6000)
            audioDetailsCard.classList.remove("animate-pulse", "interactions-disabled");
            audioDetailsCard.classList.add("hidden");
            btnAfterLoading()
            return;
        }

        if (audioDetails.status_code === 200) {
            console.log(audioDetails)
            // await holds the line of code till u get details from py as soon as u stop holding it means u fetched the data so remove the pulse
            audioDetailsCard.classList.remove("animate-pulse", "interactions-disabled");

            // check if the status code is 200 then that means i've received the thumb,.... so update them
            audioDisplayThumb.src = audioDetails.thumbnail_display_url;
            audioSaveThumb.href = audioDetails.thumbnail_max_url;
            audioYTTitle.innerText = audioDetails.title;
            audioYTDuration.innerText = `${audioDetails.duration}`;
            handleTags(audioDetails.tags, false, showTags);
            // there are no tags for the video
            print(audioDetails.tags)

            if (audioDetails.is_live) {
                pingMessage("cannot download a live stream. you can still download thumbnail and get tags of the video");
                btnAfterLoading()
                return
            }

            // get the default loc if specified
            const specified_loc = await getDefaultLoc()

            // call the function to download the actual content audio that the user requested!
            let audioDownloaded = await eel.download_audio(yt_video_url.value, specified_loc, audioDetails.file_name)()
            btnAfterLoading();
            if (audioDownloaded.status_code === 200) {
                pingMessage("Downloaded Successfully");
                yt_video_url.value = "";
                document.querySelector(".audio-download-percentage").innerText = "Downloaded Successfully";
            } else if (audioDownloaded.status_code === 401) {
                pingMessage(audioDownloaded.error);
            } else {
                pingMessage(`An error ${audioDownloaded.status_code} occurred`);
                console.log(audioDownloaded.error);
            }
        } else {
            audioDetailsCard.classList.add("hidden");
            pingMessage(audioDetails.error, 5000)
            btnAfterLoading();
        }

        // else part if the url entered is not a valid url
    } else {
        pingMessage("please enter an youtube link");
    }

}

// extracts tags and calls handle tags giving the fetched tags from python
async function extractTags(yt_video_url) {
    btnBeforeLoading()
    if (!(tagsCard.classList.contains("hidden"))) {
        tagsCard.classList.add("interactions-disabled", "animate-pulse")
    }
    const tags_from_py = await eel.extract_tags(yt_video_url)()
    tagsCard.classList.remove("interactions-disabled", "animate-pulse")
    // print(tags_from_py.tags)
    if (tags_from_py.status_code === 200) {
        handleTags(tags_from_py.tags, true)
    } else {
        pingMessage(tags_from_py.error, 5000)
    }
    btnAfterLoading()
}

// creates tags and handles displaying tags in audio download card
function handleTags(tags, is_extract_tags, showTagElement) {
    // audio's show tag functionality is being handled here!
    if (!(is_extract_tags)) {
        showTagElement.addEventListener("click", function () {
            if (showTagElement.checked) {
                tagsCard.classList.remove("hidden")
                if (tags.length <= 0) {
                    copyBtn.classList.add("hidden");
                    document.getElementById("video-has-no-tags").classList.remove("hidden");
                    selectAllbtn.classList.add("hidden");
                } else {
                    if (copyBtn.classList.contains("hidden")) {
                        copyBtn.classList.remove("hidden");
                    }
                    document.getElementById("video-has-no-tags").classList.add("hidden");
                    selectAllbtn.classList.remove("hidden");
                }
            } else {
                tagsCard.classList.add("hidden")
            }
        })
    } else {
        tagsCard.classList.remove("hidden");
        if (tags.length <= 0) {
            videoHasNoTags();
            document.querySelector("#yt-url-input").value = ""
        }
    }
    print(tags)
    // destroy the previous tags or destroy the tags if its requested second time
    if (tagTextElements) {
        tagTextElements.forEach(function (tag) {
            tag.remove();
        })
    }

    tags.forEach(function (tag) {
        const tagElement = document.createElement("div");
        tagElement.classList.add('tag-el', 'border', 'border-zinc-600', 'hover:cursor-pointer', 'hover:bg-red-500', 'duration-200', 'py-2', 'px-4', 'text-lg', 'transition-all')
        tagElement.innerText = tag;
        document.querySelector(".tags-grid").appendChild(tagElement)
    })
    tagTextElements = document.querySelectorAll(".tag-el");

    // applies background color classes to the tags when clicked
    tagTextElements.forEach(function (tag) {
        tag.addEventListener("click", function () {
            tag.classList.toggle("bg-red-500");
            tag.classList.toggle("text-white");
            tag.classList.toggle("text-zinc-50");
            tag.classList.toggle("tag-selected")
        })
    })
}

// -------------------------------------------- ui helpers -------------------------------------------------------------


function btnBeforeLoading() {
    go.disabled = true;
    go.innerText = "Extracting..."
    go.classList.remove("bg-blue-600", "hover:bg-blue-700");
    go.classList.add("opacity-75", "bg-gray-500", "animate-pulse");
}

function btnAfterLoading() {
    go.innerText = "Go"
    go.classList.remove("opacity-75", "bg-gray-500", "animate-pulse")
    go.classList.add("bg-blue-600", "hover:bg-blue-700");
    go.disabled = false;
}

function resetAudioCard() {
    if (!(audioDetailsCard.classList.contains("hidden"))) {
        audioDetailsCard.classList.add("hidden");
    }
}

function resetTagCard() {
    if (!(tagsCard.classList.contains("hidden"))) {
        tagsCard.classList.add("hidden");
    }
}

function videoHasNoTags() {
    print("video has no tags")
    tagsCard.classList.remove("hidden")
    copyBtn.classList.add("hidden");
    document.getElementById("video-has-no-tags").classList.remove("hidden");
    selectAllbtn.classList.add("hidden");
}


// for reference -------------------------------------------------------------------------------------------------------
function createVideoQualityOptions(videoQualityObj) {
    const qualitiesOption = document.querySelector("#download-option")

    // Remove existing children
    while (qualitiesOption.firstChild) {
        qualitiesOption.removeChild(qualitiesOption.firstChild);
    }

    Object.entries(videoQualityObj).forEach(function ([videoQuality, value]) {
        // create the option
        const qualityOption = document.createElement("option")
        // set the option's value
        qualityOption.value = videoQuality
        // set the text of the option
        qualityOption.innerText = `${videoQuality}p${value.video_fps} (${value.filesize}MB)`
        console.log(value)
        // create a data-src attr called data-vcodec which will be used to send to the download py func to properly download the selected quality by the user
        qualityOption.dataset.vcodec = value.vcodec
        qualitiesOption.appendChild(qualityOption)
        // select the default 1080p quality if 1080p quality is available it'll be selected
        if (videoQuality.includes("1080")) {
            qualityOption.selected = true
        }
    })

}

