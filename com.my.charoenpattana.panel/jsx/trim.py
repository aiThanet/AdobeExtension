from PIL import Image
from glob import glob
from tqdm import tqdm

def trim_all_images(folder_path, f):
    for name in tqdm(glob(folder_path + "/*.png")):
        trim_image(name, f)

def trim_image(image_path, f):
    try:
        im = Image.open(image_path)
        width, height = im.size
        bbox = im.getbbox()
        b_width = bbox[2] - bbox[0]
        b_height = bbox[3] - bbox[1]
        if(b_width == width and b_height == height):
            return
        im2 = im.crop(im.getbbox())
        im2.save(image_path)
    except Exception as e:
        print("ERROR: ", image_path + " : " + str(e))
        f.write(image_path + " : " + str(e))
    
f = open("\\\\JPNNAS\\jpndesign\\images\\error.txt", "a")
trim_all_images('\\\\JPNNAS\\jpndesign\\images\\withoutDescription', f)
trim_all_images('\\\\JPNNAS\\jpndesign\\images\\withOnlyImage', f)
f.close()