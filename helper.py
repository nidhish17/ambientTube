from tkinter import Tk
import pynvml, eel
import re

def get_user_window_size():
    root = Tk()
    width = root.winfo_screenwidth()
    height = root.winfo_screenheight()
    root.destroy()
    return width, height

def sanitize_title(yt_title):
    filename = yt_title
    invalid_chars = ["|", ">", "<", ":", '"', "/", "\\", "*", "?"]
    for char in invalid_chars:
        if char in filename:
            filename = filename.replace(char, "")
    return filename

def remove_ansi_escape_codes(text):
    ansi_escape = re.compile(
        r'(?:\x1B[@-_]|[\x1B|\x9B])[\x30-\x3F]*[\x20-\x2F]*[\x40-\x7E]|[\x9B\x1B][\x30-\x3F]*[\x20-\x2F]*[\x40-\x7E]')
    return ansi_escape.sub('', text)


@eel.expose
def has_nvidia_gpu():
    try:
        pynvml.nvmlInit()
        device_count = pynvml.nvmlDeviceGetCount()
        pynvml.nvmlShutdown()
        return device_count > 0
    except pynvml.NVMLError:
        return False