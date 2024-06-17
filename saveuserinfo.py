import json
import os
from json.decoder import JSONDecodeError

class SaveLocationManager:
    def __init__(self, save_file="user/save_loc.json"):
        self.save_file = save_file

    def save_location(self, specified_loc):
        try:
            # Ensure dir exists
            os.makedirs(os.path.dirname(self.save_file), exist_ok=True)

            data = {"specified_save_loc": specified_loc}
            with open(self.save_file, "w") as file:
                json.dump(data, file, indent=4)
            return {"message": "success", "status_code": 200}
        except PermissionError as e:
            return {"message": f"{e}", "status_code": 500}
        except Exception as e:
            return {"message": f"An error occurred: {e}", "status_code": 500}

    def load_save_loc(self):
        try:
            if os.path.exists(self.save_file):
                with open(self.save_file, "r") as file:
                    return json.load(file)
            return {"message": "default save loc not specified", "status_code": 404}
        except PermissionError as e:
            return {"message": f"{e}", "status_code": 500}

class VideoInfoManager:
    def __init__(self, info_file="user/video_info.json"):
        self.info_file = info_file

    def save_videoinfo(self, new_info):
        try:
            os.makedirs(os.path.dirname(self.info_file), exist_ok=True)
            data = self.get_videoinfo().get("data")
            data.append(new_info)
            with open(self.info_file, "w") as f:
                json.dump(data, f, indent=4)
        except PermissionError as e:
            return {"message": f"{e}", "status_code": 500}
        except Exception as e:
            return {"message": f"An error occurred: {e}", "status_code": 500}

    def get_videoinfo(self):
        try:
            if os.path.exists(self.info_file):
                with open(self.info_file, "r") as f:
                    try:
                        data = json.load(f)
                        if data != "" or data != None:
                            return {"data": data, "status_code": 200}
                    except JSONDecodeError:
                        return []
                    except Exception as e:
                        # print(f"an error {e} occurred")
                        return {"status_code": 500, "message": e}
            return {"data": [], "status_code": 200}
        except PermissionError as e:
            return {"message": f"{e}", "status_code": 500}

    def delete_info(self, id):
        try:
            with open(self.info_file, "r") as f:
                data = json.load(f)

            for i, video_info in enumerate(data):
                if id in video_info.keys():
                    # print(video_info, i)
                    del data[i]
                    # print(data)
                    # print(data[video_info])
            # if id in data[0].keys():
            #     print("tru")
            #     del data[0][id]
            with open(self.info_file, "w") as f:
                json.dump(data, f, indent=4)
                return {"message": "success", "status_code": 200}
        except PermissionError as e:
            return {"message": f"{e}", "status_code": 500}




# --------------------------------------------------------
# {
#         "l0klXc7gHIc1080": {
#             "title": "Ethereal Cyberpunk Ambient for Cyberpunk 2077 - Calm Blade Runner Ambient Vibes",
#             "duration": "2:00:00",
#             "save_thumb": "https://i.ytimg.com/vi/l0klXc7gHIc/maxresdefault.jpg",
#             "display_thumb": "https://i.ytimg.com/vi/l0klXc7gHIc/mqdefault.jpg"
#         }
#     }