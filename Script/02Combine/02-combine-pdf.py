import img2pdf
import glob
from pypdf import PdfWriter

    
merger = PdfWriter()
pdf_folder = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\01 แยกไฟล์ PDF\\'
pdfs = glob.glob(pdf_folder + "*.pdf")
for pdf in pdfs:
    merger.append(pdf)

output_file = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\02 รวมเล่ม\\merge.pdf'

merger.write(output_file)
merger.close()