import img2pdf
import glob
from pypdf import PdfMerger

output_folder = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\00 ต้นฉบับ ลายน้ำ\\'
output_file = 'C:\\Users\\jpndesign.JPN\\Documents\\ส่งโรงพิมพ์\\01 แยกไฟล์ PDF\\03เนื้อหา.pdf'
# specify paper size (A4)
a4inpt = (img2pdf.mm_to_pt(210),img2pdf.mm_to_pt(297))
layout_fun = img2pdf.get_layout_fun(a4inpt)
	
with open(output_file,"wb") as f:
	f.write(img2pdf.convert(glob.glob(output_folder + "*.jpg"), layout_fun=layout_fun))
	
