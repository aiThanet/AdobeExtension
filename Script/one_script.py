from PIL import Image, ImageDraw, ImageFont
from glob import glob
from tqdm import tqdm
from pathlib import Path

import os
import img2pdf
from datetime import datetime
from pypdf import PdfMerger, PdfWriter
from pdf2image import convert_from_path

def add_watermask_all_images(folder_path, watermask_path, output_path):
    page = 1
    for image_path in tqdm(glob(folder_path + "/*.png")):
        add_watermask(image_path, watermask_path, output_path, page)
        page += 1


def add_watermask(image_path, watermask_path, output_path, page_number=None):
    background = Image.open(watermask_path)
    foreground = Image.open(image_path)

    background.paste(foreground, (0, 0), foreground)

    # Draw page number
    if page_number is not None:
        draw = ImageDraw.Draw(background)
        try:
            font_path = r"C:\Users\JPNDESIGN.JPN\AppData\Local\Microsoft\Windows\Fonts\THSarabunNew BOLD.ttf"
            font = ImageFont.truetype(font_path, size=80)
        except:
            font = ImageFont.load_default()

        text = str(page_number)

        # Use textbbox to get text size
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        x = (background.width - text_width) // 2
        y = background.height - text_height - 60  # 20 px from bottom

        draw.text((x, y), text, font=font, fill="white")

    
    background.save(output_path + '\\' + Path(image_path).stem + '.jpg', optimize=True, dpi=(300, 300))


print("Step1/3: Adding watermarks and page number to images...")
input_folder = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\00 ต้นฉบับ'
output_folder = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\00 ต้นฉบับ ลายน้ำ'
watermask_path = './Watermask_5.jpg'
add_watermask_all_images(input_folder, watermask_path, output_folder)


print("Step2/3: Converting images to PDF...")
output_folder = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\00 ต้นฉบับ ลายน้ำ\\'
output_file = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\01 แยกไฟล์ PDF\\03 เนื้อหา.pdf'
# specify paper size (A4)
a4inpt = (img2pdf.mm_to_pt(210),img2pdf.mm_to_pt(297))
layout_fun = img2pdf.get_layout_fun(a4inpt)
	
with open(output_file,"wb") as f:
	f.write(img2pdf.convert(glob(output_folder + "*.jpg"), layout_fun=layout_fun))

print("Step3/3: Combining PDFs and save...")
merger = PdfWriter()
pdf_folder = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\01 แยกไฟล์ PDF\\'
pdfs = glob(pdf_folder + "*.pdf")
for pdf in pdfs:
    merger.append(pdf)


today_date = datetime.now().strftime("%Y-%m-%d")
output_file = f'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\02 รวมเล่ม\\ม้าทอง {today_date}.pdf'

merger.write(output_file)
merger.close()
	
# print("Step4/4: Exporting PDF pages to images...")


# # Folder to save images
# output_path = f'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\03 แยกหน้าเล่ม\\'
# os.makedirs(output_path, exist_ok=True)
# # Convert PDF to images
# pages = convert_from_path(output_file, dpi=300, poppler_path = r"C:\Users\jpndesign.JPN\Downloads\Release-25.07.0-0\poppler-25.07.0\Library\bin" )

# for i, page in tqdm(enumerate(pages, start=1)):
#     image_path = os.path.join(output_path, f'page_{i}.jpg')
#     page.save(image_path, 'JPEG', quality=95)
    