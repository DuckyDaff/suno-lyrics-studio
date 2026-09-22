# Convert generated card PNGs (640px) into small JPGs for the app and delete the PNGs.
import os, glob
from PIL import Image
OUT = 'public/kid/cards'
n = 0
for p in glob.glob(os.path.join(OUT, '*.png')):
    im = Image.open(p).convert('RGB')
    w, h = im.size
    im = im.crop((int(w * .06), int(h * .06), int(w * .94), int(h * .94))).resize((256, 256), Image.LANCZOS)
    im.save(p[:-4] + '.jpg', quality=82, optimize=True)
    os.remove(p); n += 1
print('converted', n, 'total jpg:', len(glob.glob(os.path.join(OUT, '*.jpg'))))
