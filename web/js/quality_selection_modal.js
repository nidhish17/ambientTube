// video qualities modal
const videoQualitiesModal = document.querySelector("#video-qualities-modal")
// modal close btn
const qModalCloseBtn = document.querySelector(".modal-close-btn")

const pageBody = document.querySelector("#page-body")

qModalCloseBtn.addEventListener("click", () => {
    videoQualitiesModal.classList.add("hidden")
})

// header youtube link
const modalYtLink = document.querySelector(".yt-link-header");
// yt title
const modalYtTitle = document.querySelector(".title-quality-header");
// modal duration
const modalYtDuration = document.querySelector(".duration-quality-header");
// yt details container
const ytDetailsContainer = document.querySelector(".yt-details-container");
// display thumb in modal
const modalDisplayThumb = document.querySelector(".modal-display-thumb-img");
// fetching details spinner
const fetchingDetails = document.querySelector(".fetching-details");
// quality select download form
const modalDownloadForm = document.querySelector("#download-video-select-quality");

// select the download quality option box
let qualitiesOption = document.querySelector("#download-option");

// select the convert to h264 checkbox
const convertToH264 = document.querySelector(".convert-to-h264");
const convertToH264Switch = document.querySelector(".convert-to-h264-switch");

// this adds an event listener so that whenever a quality is selected then it'll check if its 2k or 4k and enable h264 conversion
qualitiesOption.addEventListener("change", function () {
    // attach an event listner to qualities option so taht when 4k is selected allow the convert to h264
    const selected_quality_option = qualitiesOption.options[qualitiesOption.selectedIndex];

    // print(selected_quality_option, "user selected something")
    if (selected_quality_option.dataset.is_qhd_uhd === "true") {
        convertToH264.disabled = false
        convertToH264Switch.classList.remove("cursor-not-allowed", "opacity-50");
    } else {
        convertToH264.disabled = true
        convertToH264Switch.classList.add("cursor-not-allowed", "opacity-50");
    }
});


modalDownloadForm.addEventListener("submit", function (e) {
    e.preventDefault()
    // here now select the video download card and then download it..... should use threading to add multiple videos to the queue container;
    handleDownloadingVideo(videoDetails);
    videoQualitiesModal.classList.add("hidden");
});


const handleDownloadingVideo = async function (videoDetails) {
    const selected_quality_option = qualitiesOption.options[qualitiesOption.selectedIndex];
    const [{title, display_thumb, duration, save_thumb, sanitized_title}, youtubeLink] = videoDetails;
    // create video card instance
    const videoCard = new createVideoCard(videoDetails)
    // get the specified default loc or false(not specified) and pass it based in it py will trigger loc specification
    const specifiedLoc = await getDefaultLoc();
    const videoFileName = `${sanitized_title}[ambientTube]${Date.now()}`;
    videoCard.createCard()

    eel.expose(update_progress)
    function update_progress(progress, percent) {
        console.log(progress, percent)
        videoCard.updateProgress(progress, percent)
    }

    if (selected_quality_option.dataset.is_qhd_uhd === "false") {

        // disable the search
        formSubmitBtn.classList.add("interactions-disabled", "animate-pulse")
        document.querySelector(".body-processing-text").classList.remove("hidden")
        // get the codec
        const vcodec = selected_quality_option.dataset.vcodec
        // python function to download 1080p videos in H.264 format
        const video_download = await eel.download_video(youtubeLink, videoFileName, specifiedLoc, selected_quality_option.value)()
        checkStatusOfCode(video_download, videoCard, selected_quality_option.value, videoFileName, vcodec, selected_quality_option.dataset.resolution, false)
    } else {
        formSubmitBtn.classList.add("interactions-disabled", "animate-pulse")
        document.querySelector(".body-processing-text").classList.remove("hidden")
        let convertFormatToH264 = convertToH264.checked; // may return string in python care ("true") ps: booleans are handles properly in eel so true == True
        // get the codec
        const vcodec = selected_quality_option.dataset.vcodec
        // python function to download 4k videos
        const video_download_4k = await eel.download_video_4k(youtubeLink, videoFileName, specifiedLoc, selected_quality_option.value, vcodec, convertFormatToH264)()
        checkStatusOfCode(video_download_4k, videoCard, selected_quality_option.value, videoFileName, vcodec, selected_quality_option.dataset.resolution, convertFormatToH264)
        convertFormatToH264.checked = false;
    }

    // print(youtubeLink, title, display_thumb, save_thumb, duration, sanitized_title)
}

const checkStatusOfCode = async function (video_download, videoCard, videoQuality, videoFileName, vcodec, resolution, convertFormatToH264) {
    // params video_download:- status_code, message returned from python
    // videoCard:- card instance
    // this func checks if the download was successful and if it was then it calls the write to json func to updatre tthe videos downloaded
    try {
        document.querySelector(".body-processing-text").classList.add("hidden")
        formSubmitBtn.classList.remove("interactions-disabled", "animate-pulse")
    } catch (error) {
        console.log(error)
    }
    // fgetch the location again because when the user clicks download video then if its the user's first time then the video download funcin py itsdsself handles
    // the specifying the location and saving it in json file but the problem b4 was i was passing the default fetched location b4 the user clicked download which was undefied
    // or returned a staus_code of 401 so the python .get func retuned none which triggered the else part to open the file specification and updating it
    // but after its updated i need to fetch again while saving noe the defgault fetch that i did b4 the user clicked download so fetching here agin to get the updated one to save it in the
    // video_info.json
    const specifiedLoc = await getDefaultLoc();
    if (video_download.status_code === 200) {
        pingMessage(video_download.message)
        // put the downloaded tag
        videoCard.downloadSuccess(videoQuality, videoFileName, specifiedLoc, vcodec, resolution, convertFormatToH264)
    } else if (video_download.status_code === 401) {
        pingMessage("Please Specify PATH TO SAVE");
        videoCard.deleteCardPathNotSpecified()
    } else {
        // remove hidden for the error element and log the error message
        let message;
        if (!(video_download.status_code === 200)){
            message = "Please check your connection & try again later.\n" + video_download.message
        } else {
            message = video_download.message
        }
        videoCard.logError(message)
    }
}

const hasGpu = async () => {
    return await eel.has_nvidia_gpu()()
}


class createVideoCard {
    constructor(videoDetails) {
        // the constructor videoDetails is for to update the details fetched previously to update card the same 1 to update the video card
        // video_download var in the handleDownloadingVideo func is the one that downloads video and logs success and error
        [this.videoDetails] = videoDetails;
        this.videoCardElement = null;
        this.deleteCardId = null;
    }

    createCard() {
        const videoCardTemplate = document.querySelector("#video-card-template");
        const videoCardClone = videoCardTemplate.content.cloneNode(true);
        const containerHousingVideoCards = document.querySelector("#video-cards-container");
        const cardDeleteBtn = videoCardClone.querySelector(".card-delete-button");
        cardDeleteBtn.addEventListener("click", () => this.deleteCardDownloaded())
        this.updateCardDetails(videoCardClone);
        this.videoCardElement = videoCardClone.querySelector(".video-download-card").parentElement
        // Append to the top of the container
        if (containerHousingVideoCards.firstChild) {
            containerHousingVideoCards.insertBefore(videoCardClone, containerHousingVideoCards.firstChild);
        } else {
            containerHousingVideoCards.appendChild(videoCardClone);
        }
        // removing hidden class for the progress bar as the card is created
        const progressBarContainer = this.videoCardElement.querySelector(".progress-bar-container");
        progressBarContainer.classList.remove("hidden");
        progressBarContainer.querySelector(".progress-text").innerText = "Queued"
    }

    updateCardDetails(videoCardClone) {
        const title = videoCardClone.querySelector(".video-title");
        const displayThumb = videoCardClone.querySelector(".video-card-display-thumbnail");
        const saveThumb = videoCardClone.querySelector(".video-card-download-thumbnail");
        const videoDuration = videoCardClone.querySelector(".video-duration");
        title.innerText = this.videoDetails.title;
        displayThumb.src = this.videoDetails.display_thumb;
        saveThumb.href = this.videoDetails.save_thumb;
        videoDuration.innerText = this.videoDetails.duration
    }

    deleteCardPathNotSpecified() {
        this.videoCardElement.remove();
    }

    async deleteCardDownloaded() {
        this.videoCardElement.remove();
        await eel.delete_video_card(this.deleteCardId)()
    }

    updateProgress(progress, percent) {
        // console.log(progress, percent, "progress, percent")
        const progressPercent = progress.split("/")[0]
        // console.log(progressPercent)
        const progressBarContainer = this.videoCardElement.querySelector(".progress-bar-container");
        const progressBar = progressBarContainer.querySelector(".progress-bar");
        const progressText = progressBarContainer.querySelector(".progress-text");
        progressText.innerText = `Downloading ${progress}`;
        const downloadedPercent = parseFloat(percent)
        progressBar.style.width = `${100 - downloadedPercent}%`
        if (percent === "100.0%") {
            if (!hasGpu()) {
                progressText.innerText = "Converting To H264\nMay take longer if you don't have a nvidia GPU or if your device is slow";
                progressBar.style.width = "100%";
            }
            progressText.innerText = "Please Wait Processing\n(conversion will take longer time please be PATIENT)";
            progressBar.style.width = "100%";
        }
    }

    async openFileLoc(filePath) {
        const r = await eel.open_file_loc(filePath)();
        pingMessage(r.message);
    }

    async downloadSuccess(quality, videoFileName, specified_loc, vcodec, resolution, convertFormatToH264) {
        this.deleteCardId = `${this.videoDetails.video_id}${quality}`
        const progressBarContainer = this.videoCardElement.querySelector(".progress-bar-container");
        progressBarContainer.classList.add("hidden")
        // add the downloaded tag
        this.videoCardElement.querySelector(".download-status").classList.remove("hidden");
        const openFileLocBtn = this.videoCardElement.querySelector(".open-file-location-button");
        openFileLocBtn.addEventListener("click", () => this.openFileLoc(`${specified_loc.save_loc}/${videoFileName}`))
        document.querySelector("#video-youtube-link-input").value = "";
        if (convertFormatToH264) {
            this.videoCardElement.querySelector(".vcodec-text").innerText = "H264(converted)";
            vcodec = "H264(converted)"
        } else {
            this.videoCardElement.querySelector(".vcodec-text").innerText = vcodec.split(".")[0];
        }
        this.videoCardElement.querySelector(".resolution-text").innerText = resolution
        // call the eel function to update the video details to the json file
        console.log("calling ypdate_video_details")
        await eel.update_video_details(this.videoDetails, quality, `${specified_loc.save_loc}/${videoFileName}`, vcodec, resolution)();
    }

    logError(message) {
        this.videoCardElement.querySelector(".download-status").classList.add("hidden");
        this.videoCardElement.querySelector(".error-logger").classList.remove("hidden");
        this.videoCardElement.querySelector(".error-text").innerText = message
    }

} // class end

