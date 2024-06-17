window.addEventListener("resize", async function () {
    const {width, height} = await eel.app_window_size()()
    window.resizeTo(width, height);
});


// select the alert element
const alert = document.getElementById("error-msg");

function pingMessage(message, timeout = 3000) {
    alert.querySelector(".message").innerText = message;
    alert.classList.remove("hidden")
    setTimeout(function () {
        alert.classList.add("hidden");
    }, timeout)
}


const checkYtUrl = function (url) {
    const ytUrl = url.trim()
    return !!(ytUrl.includes("youtube.com/watch") || ytUrl.includes("youtu.be/") || ytUrl.includes("youtube.com/shorts"));
}

// Get the default save location or indicate that it's not specified
const getDefaultLoc = async function () {
    const defaultLoc = await loadDataObj.getSaveLoc()
    if (defaultLoc.status_code !== 404) {
        return {"specified": true, "save_loc": defaultLoc.specified_save_loc};
    } else {
        return {"specified": false}
    }
}
