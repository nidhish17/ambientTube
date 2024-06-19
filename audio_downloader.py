from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError, ExtractorError, UnavailableVideoError
import os
from tkinter import filedialog
import datetime as dt
import tkinter as tk
from helper import sanitize_title, remove_ansi_escape_codes
import eel
from saveuserinfo import SaveLocationManager

save_manager = SaveLocationManager()

class AudioDownload:
    def __init__(self, video_url):
        self.video_url = video_url
        self.ffmpeg_path = os.path.join(os.path.dirname(__file__), "web", "ffmpeg", "ffmpeg.exe")
        # print(f"FFmpeg path: {self.ffmpeg_path}")

    def audio_downloader_hook(self, d):
        if d["status"] == "downloading":
            progress_percent = remove_ansi_escape_codes(d["_percent_str"])
            eel.updateAudioProgress(f"{progress_percent}")()

    def download_audio(self, file_name, default_loc, audio_quality=320):

        if default_loc.get("specified"):
            save_path = f"{default_loc.get('save_loc')}/{file_name}"
        else:
            # ensure the filedialoug window appears on top of the eel window
            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)  # Ensure it's on top
            save_path = filedialog.asksaveasfilename(filetypes=[("MP3 files", "*.mp3"), ("All files", "*.*")], initialfile=file_name, parent=root)
            dir_path = os.path.dirname(save_path)
            save_manager.save_location(dir_path)
            eel.firstTime(dir_path)

        if not save_path:
            return {
                "error": "please specify path to save",
                "status_code": 401
            }

        ydl_opts = {
            "format": "bestaudio/best",
            # "listformats": True,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": str(audio_quality)
            }],
            "ffmpeg_location": self.ffmpeg_path,
            "outtmpl": f"{save_path}",
            "updatetime": False,
            "progress_hooks": [self.audio_downloader_hook]
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                # info_dict = ydl.extract_info(self.video_url, download=True)
                ydl.download([self.video_url])
        except DownloadError as e:
            # print(f"An error {e} occurred")
            return {
                "error": f"error fetching details {e}",
                "status_code": 500
            }
        except UnavailableVideoError as e:
            # print(e)
            return {
                "error": "video unavailable",
                "status_code": 500
            }
        except Exception as e:
            return {
                "status_code": 500,
                "error": f"an error {e} occurred"
            }

        # print("downloaded")
        return {
            "status_code": 200
        }

    def get_details(self):
        ydl_opts = {
            "format": "bestaudio/best",
            # "listformats": True,
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(self.video_url, download=False)
        except ExtractorError as e:
            # print(f"An error {e} occurred")
            return {
                "error": f"error fetching details {e}",
                "status_code": 500
            }
        except UnavailableVideoError as e:
            return {
                "error": "video unavailable",
                "status_code": 500
            }
        except DownloadError as e:
            return {
                "error": f"An error {e} occurred",
                "status_code": 500
            }
        except Exception as e:
            # print(type(e).__name__, "type of the error") # its download error
            return {
                "error": f"An error {e} occurred",
                "status_code": 500
            }


        # get the tags related to that video
        yt_video_id = info_dict["id"]
        tags = info_dict["tags"]
        # get the thumbnail url for that video
        thumbnail_url_max_res = f"https://i.ytimg.com/vi/{yt_video_id}/maxresdefault.jpg"
        thumbnail_urls = info_dict["thumbnails"]
        # pprint(thumbnail_urls)
        # get the title of the video
        title = info_dict["title"]
        # get the duration of the video/audio
        duration = info_dict.get("duration_string", None)
        # display thumb
        display_thumb = None
        for thumb in thumbnail_urls:
            if thumb["id"] == "26":
                display_thumb = thumb["url"]


        return {
            # we dont require tags when the user wants to download audio
            "tags": tags,
            "is_live": info_dict.get("is_live"),
            "thumbnail_max_url": thumbnail_url_max_res,
            "thumbnail_display_url": display_thumb if display_thumb is not None else "thumbnail not available",
            "title": str(title),
            "duration": duration,
            "file_name": f"{sanitize_title(title)}[ambientTube][{dt.datetime.now().strftime('%S-%f')}]",
            "status_code": 200
        }



# video_url = "https://www.youtube.com/watch?v=jExu6sEPPX4"
# audio = AudioDownload(video_url)
# audio.get_details()
# audio.download_audio()
