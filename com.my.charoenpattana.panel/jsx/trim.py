from PIL import Image
from glob import glob

def trim_all_images(folder_path):
    for name in glob(folder_path + "/*.png"):
        trim_image(name)

def trim_image(image_path):
    im = Image.open(image_path)
    im.size 
    im.getbbox()
    im2 = im.crop(im.getbbox())
    im2.size
    im2.save(image_path)

trim_all_images('\\\\JPNNAS\\jpndesign\\image\\withoutDescription')