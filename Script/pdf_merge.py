from PIL import Image, ImageDraw, ImageFont
from glob import glob
from tqdm import tqdm
from pathlib import Path

import os
import img2pdf
from datetime import datetime
from pypdf import PdfMerger, PdfWriter
from pdf2image import convert_from_path

print("Step3/3: Combining PDFs and save...")
merger = PdfWriter()
pdf_folder = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\AllPDF\\'
pdfs = glob(pdf_folder + "*.pdf")
for pdf in pdfs:
    merger.append(pdf)

today_date = datetime.now().strftime("%Y-%m-%d")
output_file = f'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\ม้าทอง {today_date}.pdf'

merger.write(output_file)
merger.close()