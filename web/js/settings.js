
// setting new default path
const specifyDefaultLocBtn = document.querySelector(".specify-default-loc-btn");
const defaultPathLabel = document.querySelector("#default-path-label");
specifyDefaultLocBtn.addEventListener("click", async () => {
    const directory = await eel.set_default_path()()
    if (directory.status_code === 200) {
        defaultPathLabel.innerText = directory.path
    } else if (directory.status_code === 400) {
        pingMessage(directory.message)
    } else if (directory.status_code !== 200) {
        pingMessage(directory.message)
    }
})


// class to fetch the default save location from python
class loadData {
    constructor() {

    }

    // Fetches the default save location from the backend
    async getSaveLoc() {
        return await eel.fetch_default_loc()()
    }

    // Updates the UI with the default save location if available
    async updateSaveLoc() {
        const saveLoc = await this.getSaveLoc();
        if (saveLoc.status_code !== 404)
            defaultPathLabel.innerText = saveLoc.specified_save_loc;
    }

}

// create an instance of the class
const loadDataObj = new loadData();
// call the updateSaveLoc function (this function gets the default save loc specified from py and updates it to the UI)
loadDataObj.updateSaveLoc();

// Exposes the function to update the save location UI when called from Python
eel.expose(firstTime)
function firstTime(directoryPath) {
    defaultPathLabel.innerText = directoryPath;
    pingMessage(`all your downloads will be saved to ${directoryPath}\nTo change please go to settings`, 7000)
}

// show hide settings modal
/* handle settings and NAV settings icon */
const settingsBtn = document.querySelector(".settings-btn");
const settingsModal = document.querySelector(".settings-modal");

settingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
})

const settingsCloseBtn = document.querySelector(".settings-close-btn");

settingsCloseBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
})



