from PIL import Image
from glob import glob
from tqdm import tqdm
import os
import asyncio
import concurrent.futures
import functools

loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
thread_pool = concurrent.futures.ThreadPoolExecutor()


def optimize_all_images(output_path, folder_path, error_file):
    if not os.path.exists(output_path):
        os.makedirs(output_path)

    for name in tqdm(glob(folder_path + "/*.jpg")):
        optimize_image(output_path, name, error_file)
    for name in tqdm(glob(folder_path + "/*.png")):
        optimize_image(output_path, name, error_file)


def optimize_image(output_path, image_path, error_file):
    try:
        im = Image.open(image_path)
        im.save(output_path + '/' + os.path.basename(image_path), optimize=True, quality=90)
    except Exception as e:
        print("ERROR: ", image_path + " : " + str(e))
        error_file.write(image_path + " : " + str(e))


async def async_image_process(output_path, folder_path, error_file):
    await loop.run_in_executor(
        thread_pool,
        functools.partial(optimize_all_images, output_path, folder_path, error_file)
    )


async def main():
    print("Start Program")
    my_paths = ['withPrice', 'withoutPrice']
    error_file = open(f"\\\\JPNNAS\\jpndesign\\images\\error.txt", "a")
    # optimize_all_images('\\\\JPNNAS\\jpndesign\\images\\test2', '\\\\JPNNAS\\jpndesign\\images\\withoutPrice', error_file)

    async with asyncio.TaskGroup() as group:
        for my_path in my_paths:
            output_path = f'\\\\JPNNAS\\jpndesign\\images\\{my_path}'
            folder_path = f'\\\\JPNNAS\\jpndesign\\images\\{my_path}'
            group.create_task(async_image_process(output_path, folder_path, error_file))

    error_file.close()
    print("Finish Program")

asyncio.run(main())
