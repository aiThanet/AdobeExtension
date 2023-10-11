from PIL import Image
from glob import glob
from tqdm import tqdm
import asyncio
import concurrent.futures
import functools

loop = asyncio.new_event_loop()
thread_pool = concurrent.futures.ThreadPoolExecutor()

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

async def async_image_process(img, f):
    await loop.run_in_executor(
        thread_pool, 
        functools.partial(trim_all_images, img, f)
    )


async def main():
    print("Start Program")
    f1 = open("\\\\JPNNAS\\jpndesign\\images\\error_withoutDescription.txt", "a")
    f2 = open("\\\\JPNNAS\\jpndesign\\images\\error_withOnlyImage.txt", "a")
    async with asyncio.TaskGroup() as group:
        group.create_task(async_image_process('\\\\JPNNAS\\jpndesign\\images\\withoutDescription', f1))
        group.create_task(async_image_process('\\\\JPNNAS\\jpndesign\\images\\withOnlyImage', f2))
    
    f1.close()
    f2.close()
    print("Finish Program")

asyncio.run(main())


