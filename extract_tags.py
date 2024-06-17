from audio_downloader import AudioDownload

class ExtractTag(AudioDownload):
    def __init__(self, video_url):
        super().__init__(video_url)

    def extract_tags(self):
        tags = super().get_details()
        # print(tags, "tags on extract tags function")
        return tags


# tags_extractor = ExtractTag("https://youtu.be/U0jF1mdqZcs?si=INsuDtT_LyzQ0K38")
# tags = tags_extractor.extract_tags()
# print(tags["tags"])
