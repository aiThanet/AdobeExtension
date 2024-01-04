from PIL import Image
from glob import glob
from tqdm import tqdm
from pathlib import Path


def add_watermask_all_images(folder_path, watermask_path, output_path):
    for image_path in tqdm(glob(folder_path + "/*.png")):
        add_watermask(image_path, watermask_path, output_path)


def add_watermask(image_path, watermask_path, output_path):
    background = Image.open(watermask_path)
    foreground = Image.open(image_path)

    background.paste(foreground, (0, 0), foreground)

    background.save(output_path + Path(image_path).stem + '.jpg')


add_watermask_all_images('', '', '')
