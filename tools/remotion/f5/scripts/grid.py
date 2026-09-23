import sys, glob
from PIL import Image, ImageDraw
files = sorted(glob.glob(f"out/check/{sys.argv[1]}_*.jpg"))
per = int(sys.argv[2]) if len(sys.argv) > 2 else 9
w, h, cols = 640, 360, 3
for k in range(0, len(files), per):
    chunk = files[k:k + per]
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (w * cols, h * rows), "black")
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        x, y = (i % cols) * w, (i // cols) * h
        sheet.paste(Image.open(f).resize((w, h)), (x, y))
        d.text((x + 6, y + h - 16), f.split("_", 1)[1], fill=(255, 80, 80))
    out = f"out/check/grid_{sys.argv[1]}_{k // per}.jpg"
    sheet.save(out, quality=82)
    print(out)
