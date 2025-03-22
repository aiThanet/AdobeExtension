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

    background.save(output_path + '\\' + Path(image_path).stem + '.jpg', optimize=True, dpi=(300, 300))

input_folder = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\00 ต้นฉบับ'
output_folder = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\00 ต้นฉบับ ลายน้ำ'
watermask_path = 'C:\\Users\\jpndesign.JPN\\AppData\\Roaming\\Adobe\\CEP\\extensions\\AdobeExtension\\Script\\01AddWaterMask\\Watermask_5.jpg'
add_watermask_all_images(input_folder, watermask_path, output_folder)
