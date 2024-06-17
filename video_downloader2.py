from yt_dlp import YoutubeDL
import os
from tkinter import filedialog
import tkinter as tk
from helper import sanitize_title, remove_ansi_escape_codes, has_nvidia_gpu
import eel
from saveuserinfo import SaveLocationManager

class VideoDownloader:
    def __init__(self, video_url):
        self.video_url = video_url
        self.ffmpeg_path = os.path.join(os.path.dirname(__file__), "web", "ffmpeg", "ffmpeg.exe")

    def my_hook(self, d):
        if d["status"] == "downloading":
            # log the total progress downloaded
            progress_percent = remove_ansi_escape_codes(d["_percent_str"])
            speed = remove_ansi_escape_codes(d["_speed_str"])
            total_bytes = remove_ansi_escape_codes(d["_total_bytes_str"])
            eel.update_progress(f"{progress_percent} / {total_bytes} bytes {speed}", f"{progress_percent}")()

    def post_processor_hook(self, d):
        # print(d)
        if d["status"] == "processing":
            progress_percent = d["_percent_str"]
            speed = d["_speed_str"]
            # print(f"{progress_percent} {speed}")

    def download_upto_1080(self,  filename, default_loc: dict, quality=1080):
        '''
            default quality is 1080, it'll download this if quality is not specified
            this downloads video only upto 1080p(including) of codec h264
        '''

        if default_loc.get("specified"):
            save_path = f"{default_loc.get('save_loc')}/{filename}"
            # print(save_path)
        else:
            # fetch save path
            root = tk.Tk()
            root.withdraw()
            # ensure window is on top of gui window
            root.attributes("-topmost", True)
            save_manager = SaveLocationManager()

            save_path = filedialog.asksaveasfilename(
                filetypes=[("MP4 files", "*.mp4"), ("All files", "*.*")],
                initialfile=filename, parent=root)
            dir_path = os.path.dirname(save_path)
            save_manager.save_location(dir_path)
            eel.firstTime(dir_path)
            # here the tkinter default opens the file dialog and takes the path, inorder to set the default path based on what the user selects the path we
            # write the filepath to the json file and inorder to update it to the frontend and log the user that the path user specified first time will be
            # used as default we call the eel.jsexposed func. this wil;l usually happen to users who are downloading for the first time

        if not save_path:
            return {
                "error": "please specify path to save",
                "status_code": 401
            }

        ydl_opts = {
            # download video in h264 codec([vcodec^=avc])
            "format": f"bestvideo[vcodec^=avc][height<={quality}]+bestaudio[ext=m4a]/best[ext=mp4]",
            "ffmpeg_location": self.ffmpeg_path,
            "merge_output_format": "mp4",
            "postprocessors": [
                {"key": "FFmpegVideoConvertor", "preferedformat": "mp4"},
            ],
            "updatetime": False,
            "outtmpl": save_path,
            "progress_hooks": [self.my_hook],
            "noprogress": True,
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                downloaded_info = ydl.download([self.video_url])
                # print(downloaded_info, "dowenloaded info")
        except Exception as e:
            return {"message": f"An error {e} occurred", "status_code": 500}

        return {"message": f"Downloaded successfully at {save_path}", "status_code": 200}

    def get_ydl_opts(self, height, vcodec, save_path, convert_to_h264: bool, nvidia_gpu_available: bool):
        codec_args = [
            "-c:v", "h264_nvenc",
            "-preset", "slow",  # use 'hq' for even higher quality
            "-cq", "20",  # constant quantizer for quality
            "-profile:v", "high",  # use high profile
        ]
        if convert_to_h264 and nvidia_gpu_available:
            return {
                "format": f"bestvideo[height<={height}][vcodec={vcodec}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]",
                "ffmpeg_location": self.ffmpeg_path,
                "merge_output_format": "mp4",
                "postprocessors": [
                    {
                        "key": "FFmpegVideoConvertor",
                        "preferedformat": "mp4",
                    },
                    {"key": "FFmpegCopyStream"},
                ],
                "outtmpl": save_path,
                "updatetime": False,
                "progress_hooks": [self.my_hook],
                "postprocessor_hooks": [self.post_processor_hook],
                "postprocessor_args": {
                    "copystream": codec_args  # software encoding:- ["-c:v", "libx264"]
                },
            }
        else:
            return {
                "format": f"bestvideo[height<={height}][vcodec={vcodec}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]",
                "ffmpeg_location": self.ffmpeg_path,
                "merge_output_format": "mp4",
                "postprocessors": [
                    {
                        "key": "FFmpegVideoConvertor",
                        "preferedformat": "mp4",
                    },
                ],
                "outtmpl": save_path,
                "updatetime": False,
                "progress_hooks": [self.my_hook],
            }

    def download_upto_4k(self, filename, default_loc: dict, height, vcodec, convert_to_h264=False):
        # get save path specified or get new
        if default_loc.get("specified"):
            save_path = f"{default_loc.get('save_loc')}/{filename}"
            # print(save_path)
        else:
            # fetch save path
            root = tk.Tk()
            root.withdraw()
            # ensure window is on top of gui window
            root.attributes("-topmost", True)
            save_manager = SaveLocationManager()

            save_path = filedialog.asksaveasfilename(
                filetypes=[("MP4 files", "*.mp4"), ("All files", "*.*")],
                initialfile=filename, parent=root)
            dir_path = os.path.dirname(save_path)
            save_manager.save_location(dir_path)
            eel.firstTime(dir_path)

        if not save_path:
            return {
                "error": "please specify path to save",
                "status_code": 401
            }

        codec_args = []
        user_has_nvidia = has_nvidia_gpu()

        if user_has_nvidia:
            codec_args = [
                "-c:v", "h264_nvenc",
                "-preset", "slow",  # use 'hq' for even higher quality
                "-cq", "20",  # constant quantizer for quality
                "-profile:v", "high",  # use high profile
            ]

        ydl_opts = self.get_ydl_opts(height, vcodec, save_path, convert_to_h264, user_has_nvidia)

        if convert_to_h264 and user_has_nvidia:
            # print("yea need to convert to h264")
            # ydl_opts["postprocessors"].append({"key": "FFmpegCopyStream"})
            ydl_opts["postprocessors_args"] = {"copystream": codec_args}  # software encoding:- ["-c:v", "libx264"]
            # print(ydl_opts)

        with YoutubeDL(ydl_opts) as ydl:
            try:
                ydl.download([self.video_url])
            except Exception as e:
                return {"message": f"An error {e} occurred", "status_code": 500}

        return {"message": f"Downloaded successfully at {save_path}", "status_code": 200}



    def get_video_details(self):
        #todo: add unavailablevideoerror exception and other...
        ydl_opts = {
            # the format dosent matter here because either way its going to get all the available formats to display
            "format": f"bestvideo[vcodec^=avc][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]",
            "noplaylist": True,
            "forcejson": True,
            }
        try:
            with YoutubeDL(ydl_opts) as ydl:
                video_info = ydl.extract_info(self.video_url, download=False)
                video_qualities = self.get_available_video_qualities(video_info)
                video_yt_details = self.extract_youtube_details(video_info)
                return {"video_details_quality_lst": [video_qualities, video_yt_details], "status_code": 200}
        except Exception as e:
            return {"error": f"An error {e} occurred", "status_code": 500}

    def get_available_video_qualities(self, video_info):
        "gets available res, codec and filesizes of the given video url"
        formats = video_info.get("formats")

        # if we have two similar resolutions of two streams then currently they are being overwritten as dicts can have only one unique key
        # this results in better format automatically being selected (1 case tested)
        h264_streams = {}
        high_quality_streams = {}

        def convert_filesize(filesize):
            if filesize >= 1_000_000_000:
                return f"{round((filesize/1_000_000_000), 2)}GB"
            else:
                return f"{round(filesize/(1024*1024), 2)}MB"

        for res in formats:
            vcodec = res.get("vcodec")
            filesize = res.get("filesize")
            resolution = res.get("resolution")
            width = res.get("width")
            height = res.get("height")
            ext = res.get("ext")
            video_fps = res.get("fps")
            format_note = res.get("format_note")

            if "avc" in vcodec and filesize:
                h264_streams[f"{width}p{video_fps}"] = {
                    "vcodec": vcodec,
                    "resolution": resolution,
                    "width": width,
                    "height": height,
                    "filesize": convert_filesize(filesize),
                    "video_fps": video_fps,
                    "format_note": format_note
                }
                continue
                # print(vcodec, round(filesize/(1024*1024)), resolution, ext, video_fps)

            # for higher quality stream and non-h264
            if width and filesize: # width is 1920 and height is 1080 (for reference)
                # print(width, "x", height)
                if int(width) > 1920 and ("vp9" in vcodec.lower() or "vp09" in vcodec.lower() or "av01" in vcodec.lower()):
                    high_quality_streams[f"{width} x {height} ({vcodec})"] = {
                        "vcodec": vcodec,
                        "resolution": resolution,
                        "width": width,
                        "height": height,
                        "filesize": convert_filesize(filesize),
                        "video_fps": video_fps,
                        "format_note": format_note
                    }
        return h264_streams, high_quality_streams

    def extract_youtube_details(self, video_info):
        """
        this extracts youtube details like title, duration, thumbnail,
        """
        thumbnail_urls = video_info.get("thumbnails")
        title = video_info.get("title")
        duration = video_info.get("duration_string")
        is_live = video_info.get("is_live")
        video_id = video_info.get("id")
        thumbnail_url_max_res = f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
        display_thumb = None
        for thumb in thumbnail_urls:
            if thumb.get("id") == "26": display_thumb = thumb.get("url")

        return {"title": title, "duration": duration, "is_live": is_live, "save_thumb": thumbnail_url_max_res, "display_thumb": display_thumb, "sanitized_title": sanitize_title(title), "video_id": video_id}

# tests ----------------------------------------------------------------------------------------------------------------



