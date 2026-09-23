import sys, glob, os
from PIL import Image
prefix = sys.argv[1]
ids = sys.argv[2].split(",")
for sid in ids:
    files = sorted(glob.glob(f"out/check/{prefix}_{sid}_*.jpg"), key=lambda p: int(''.join(ch for ch in p.rsplit('_',1)[1] if ch.isdigit()) or 0))
    if not files: continue
    ims = [Image.open(f) for f in files]
    w, h = 800, 450
    cols = 2
    rows = (len(ims) + 1) // 2
    sheet = Image.new("RGB", (w * cols, h * rows), "black")
    for i, im in enumerate(ims):
        sheet.paste(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
    sheet.save(f"out/check/sheet_{prefix}_{sid}.jpg", quality=80)
    print("sheet", sid, len(ims))
