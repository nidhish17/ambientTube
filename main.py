import os
import sys

# eel --windowed not working fix
# https://github.com/python-eel/Eel/issues/654
# this dosent log any print statements if uncommented so foe debugging uncomment these three lines and suffer debugging
f = open(os.devnull, 'w')
sys.stdout = f
sys.stderr = f

import eel
from helper import get_user_window_size
from audio_downloader import AudioDownload
from extract_tags import ExtractTag
from video_downloader2 import VideoDownloader
import tkinter as tk
from tkinter import filedialog
from saveuserinfo import SaveLocationManager, VideoInfoManager

import subprocess
# adding this so that terminal only prints in utf-8
sys.stdout.reconfigure(encoding='utf-8')
# define app's height and width
app_size_w = 1200
app_size_h = 800

# init save and video info managers
save_loc_manager = SaveLocationManager()
video_manager = VideoInfoManager()

# initialize the app
eel.init("web")


@eel.expose
def app_window_size():
    return {"width": app_size_w, "height": app_size_h}


@eel.expose
def set_default_path():
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    directory = filedialog.askdirectory()
    if directory:
        # print(directory)
        result = save_loc_manager.save_location(directory)
        if result.get("status_code") == 200:
            return {"path": directory, "status_code": 200}
        elif result.get("status_code") != 200:
            return {"message": result.get("message"), "status_code": 500}
    else:
        return {"message": "please specify default path", "status_code": 400}


@eel.expose
def fetch_default_loc():
    # print("sending default loc")
    return save_loc_manager.load_save_loc()


@eel.expose
def get_video_details(yt_url):
    video_inst = VideoDownloader(yt_url)
    video_details = video_inst.get_video_details()
    # print(video_details)
    return video_details

# help(yt_dlp)

@eel.expose
def download_video(yt_url, filename, default_save_loc, height):
    # print(default_save_loc, "default save loc")
    video_obj = VideoDownloader(yt_url)
    download_video_ = video_obj.download_upto_1080(filename, default_save_loc, height)
    return download_video_

@eel.expose
def download_video_4k(yt_url, filename, default_save_loc, height, vcodec, convert_to_h264):
    # print(convert_to_h264, "convert to h264")
    # convert to H.264 has not been added right now!
    video_obj = VideoDownloader(yt_url)
    download_4k = video_obj.download_upto_4k(filename, default_save_loc, height, vcodec, convert_to_h264)
    return download_4k
    # return {"message": "success", "status_code": 200}

@eel.expose
def download_audio(yt_url, default_loc, file_name):
    # print(default_loc, "default loc")
    proper_url, message = check_url(yt_url)
    # print(yt_url, "yturl")
    if proper_url:
        # print("yes the url is a youtube url")
        download_audio_ = AudioDownload(message["youtube_url"])
        return download_audio_.download_audio(file_name=file_name, default_loc=default_loc)
    else:
        return message


@eel.expose
def get_audio_details(yt_url):
    proper_url, message = check_url(yt_url)
    # print(yt_url)
    if proper_url:
        # print("yes the url is a youtube url")
        download_audio = AudioDownload(message["youtube_url"])
        link_details = download_audio.get_details()
        return link_details
    else:
        return message


@eel.expose
def extract_tags(yt_url):
    proper_url, message = check_url(yt_url)
    if proper_url:
        tags = ExtractTag(message["youtube_url"])
        return tags.extract_tags()
    else:
        return message


def check_url(youtube_url):
    # youtube_url = youtube_url.strip()
    # print(youtube_url)
    if "youtube.com/watch" in youtube_url or "youtu.be/" in youtube_url or "youtube.com/shorts" in youtube_url:
        # print(youtube_url)
        return True, {"youtube_url": youtube_url}
    else:
        return False, {
            "error": "please enter a YOUTUBE URL",
            "status_code": 401
        }


# ---------- file management --------------
@eel.expose
def update_video_details(video_details, quality, file_location, vcodec, resolution):
    print("called to update")
    new_info = {
        f'{video_details.get("video_id")}{quality}': {
            "vcodec": vcodec,
            "title": video_details.get("title"),
            "duration": video_details.get("duration"),
            "save_thumb": video_details.get("save_thumb"),
            "display_thumb": video_details.get("display_thumb"),
            "file_location": file_location,
            "resolution": resolution
        }
    }
    return video_manager.save_videoinfo(new_info)


@eel.expose
def delete_video_card(id):
    # print("called", id)
    return video_manager.delete_info(id)

@eel.expose
def get_videos_downloaded():
    # print("sending data")
    return video_manager.get_videoinfo()


@eel.expose
def open_file_loc(file_path):
    try:
        # only works for windows for now
        subprocess.Popen(f'explorer /select, {os.path.realpath(file_path)}.mp4')
        return {"message": "Opening...", "status_code": 200}
    except Exception as e:
        return {"message": f"An error occurred: {e}", "status_code": 500}


# eel.spawn(get_videos_downloaded)

# get the user's screen height and width
user_width, user_height = get_user_window_size()
# calculate the center positions(ie where on the screen to place the app)
app_pos_width = user_width // 2 - app_size_w // 2
app_pos_height = user_height // 2 - app_size_h // 2

eel.start("templates/main.html", port=0, size=(app_size_w, app_size_h), jinja_templates="templates",
          position=(app_pos_width, app_pos_height))
