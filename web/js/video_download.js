print = console.log

// yt url search form
const ytUrlSearchForm = document.querySelector(".video-yt-url-input");
const formSubmitBtn = document.querySelector("#yt-url-search-submit");

// initilize videoDetails var which will be later used to update the download card info
let videoDetails;
// when link is submitted
ytUrlSearchForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    videoDetails = await handleUpdateVideoDetails()
    console.log(videoDetails)
});

// handle updating video details to the floating modal
const handleUpdateVideoDetails = async function () {
    const youtubeLink = document.querySelector("#video-youtube-link-input").value
    // if the yt url is valid then open the download modal and fetch the video details from python
    if (checkYtUrl(youtubeLink)) {
        // display the modal
        videoQualitiesModal.classList.remove("hidden");
        // set modal header link
        modalYtLink.innerText = youtubeLink;
        // add loading animation to yt details container(where the quality selections will be shown)
        ytDetailsContainer.classList.add("interactions-disabled", "animate-pulse", "opacity-20")
        fetchingDetails.classList.remove("hidden")
        // disable the form submit button
        formSubmitBtn.classList.add("interactions-disabled", "animate-pulse", "opacity-20", "bg-gray-500");
        const result = await eel.get_video_details(youtubeLink)()
        const {video_details_quality_lst, status_code} = result;
        if (!(status_code === 200)) {
            pingMessage("Please check your connection & try again later", 7000)
            ytDetailsContainer.classList.remove("interactions-disabled", "animate-pulse", "opacity-20")
            fetchingDetails.classList.add("hidden")
            formSubmitBtn.classList.remove("interactions-disabled", "animate-pulse", "opacity-20", "bg-gray-500");
            videoQualitiesModal.classList.add("hidden")
            return -1;
        }
        // fetch video details
        const [videoQualities, videoDetails] = video_details_quality_lst;
        // check if the video is live and prevent from downloading
        if (videoDetails.is_live) {
            pingMessage("Cannot Download Live Videos", 5000);
            ytDetailsContainer.classList.remove("interactions-disabled", "animate-pulse", "opacity-20")
            fetchingDetails.classList.add("hidden")
            formSubmitBtn.classList.remove("interactions-disabled", "animate-pulse", "opacity-20", "bg-gray-500");
            videoQualitiesModal.classList.add("hidden")
            return -1
        }
        // print(videoQualities)
        const [h264_streams, high_quality_streams] = videoQualities
        // print(h264_streams, high_quality_streams)
        // remove loading animation after fetching
        ytDetailsContainer.classList.remove("interactions-disabled", "animate-pulse", "opacity-20")
        fetchingDetails.classList.add("hidden")
        formSubmitBtn.classList.remove("interactions-disabled", "animate-pulse", "opacity-20", "bg-gray-500");
        // update yt details (title, thumb, duration)
        updateConstants(videoDetails)
        // update the video qualities options
        updateVideoQualitiesInfo(h264_streams, high_quality_streams)
        return [videoDetails, youtubeLink]
    } else {
        pingMessage("please enter a valid youtube link", 3000)
    }
}

// updates title, thumb, duration
function updateConstants(videoDetails) {
    // set modal display thumb
    modalDisplayThumb.src = videoDetails["display_thumb"];
    modalYtTitle.innerText = videoDetails["title"];
    modalYtDuration.innerText = videoDetails["duration"];
}

// creates available video stream options
function updateVideoQualitiesInfo(h264_streams, higher_quality_streams) {
    console.log(h264_streams, higher_quality_streams, "streams!!!!!!!!!!")
    // Remove existing children
    while (qualitiesOption.firstChild) {
        qualitiesOption.removeChild(qualitiesOption.firstChild);
    }

    // set video qualities options
    Object.entries(h264_streams).forEach(([key, value]) => {
        // print(key, value)
        // value is itself an object key: object
        const qualityOption = document.createElement("option")
        qualityOption.value = value.height
        qualityOption.dataset.vcodec = value.vcodec
        qualityOption.dataset.is_qhd_uhd = false
        qualityOption.dataset.resolution = value.resolution
        qualityOption.innerText = `${value.height}p${value.video_fps} (${value.filesize})`
        qualitiesOption.appendChild(qualityOption)
    })

    if (Object.keys(higher_quality_streams).length > 0) {
        // print(higher_quality_streams)
        // print("yea there are 4k streams available")
        Object.entries(higher_quality_streams).forEach(([key, value]) => {
            // print(key, value)
            // value is itself an object key: object
            const qualityOption = document.createElement("option")
            qualityOption.value = value.height
            qualityOption.dataset.vcodec = value.vcodec
            qualityOption.dataset.is_qhd_uhd = true
            qualityOption.dataset.resolution = value.resolution
            qualityOption.innerText = `${key} (${value.filesize})`
            qualitiesOption.appendChild(qualityOption)
        })
    }

}


// fetch cards when you visit videoDownload page
class VideoCardDownloaded {
    constructor(videoDetails, id) {
        this.videoDetails = videoDetails;
        this.id = id
        this.videoCardElement = null;
    }

    async deleteCardDownloaded() {
        await eel.delete_video_card(this.id)()
        this.videoCardElement.remove();
    }

    async openFileLoc(file_location) {
        const r = await eel.open_file_loc(file_location)();
        pingMessage(r.message);
    }

    async displayDownloadedVideoCards() {
        const videoCardTemplate = document.querySelector("#video-card-template");
        const containerHousingVideoCards = document.querySelector("#video-cards-container");
        const videoCardClone = videoCardTemplate.content.cloneNode(true);
        // console.log(videoCardClone)
        const cardDeleteBtn = videoCardClone.querySelector(".card-delete-button");
        const openFileLocBtn = videoCardClone.querySelector(".open-file-location-button");
        openFileLocBtn.dataset.fileLocation = this.videoDetails.file_location
        cardDeleteBtn.addEventListener("click", () => this.deleteCardDownloaded())
        openFileLocBtn.addEventListener("click", () => this.openFileLoc(this.videoDetails.file_location))
        const title = videoCardClone.querySelector(".video-title");
        const displayThumb = videoCardClone.querySelector(".video-card-display-thumbnail");
        const saveThumb = videoCardClone.querySelector(".video-card-download-thumbnail");
        const videoDuration = videoCardClone.querySelector(".video-duration");

        // console.log(this.videoDetails)
        title.innerText = this.videoDetails.title
        displayThumb.src = this.videoDetails.display_thumb
        saveThumb.href = this.videoDetails.save_thumb

        videoDuration.innerText = this.videoDetails.duration
        this.videoCardElement = videoCardClone.querySelector(".video-download-card").parentElement
        this.videoCardElement.querySelector(".download-status").classList.remove("hidden");
        this.videoCardElement.querySelector(".vcodec-text").innerText = this.videoDetails.vcodec.split(".")[0];
        this.videoCardElement.querySelector(".resolution-text").innerText = this.videoDetails.resolution;
        // console.log(videoCardClone)
        // containerHousingVideoCards.appendChild(videoCardClone);
        if (containerHousingVideoCards.firstChild) {
            containerHousingVideoCards.insertBefore(videoCardClone, containerHousingVideoCards.firstChild);
        } else {
            containerHousingVideoCards.appendChild(videoCardClone);
        }
    }

}

(async () => {
    const data = await eel.get_videos_downloaded()()

    if (data.status_code !== 200) {
        pingMessage(data.message);
        return;
    }
    const downloadedVideoDetails = data.data
    if (downloadedVideoDetails.length !== 0)
        downloadedVideoDetails.forEach((obj) => {
            // console.log("being executed")
            // console.log()
            // console.log(Object.values(obj)[0])
            const videoCard = new VideoCardDownloaded(Object.values(obj)[0], Object.keys(obj)[0]);
            videoCard.displayDownloadedVideoCards();
        })
})()






