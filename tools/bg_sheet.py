# 배경 2×2 시트 → 720×1280 JPG 4장 (흰 틈을 찾아 자름)
import sys, numpy as np
from PIL import Image
src, names, outdir = sys.argv[1], sys.argv[2].split(','), sys.argv[3]
im = Image.open(src).convert('RGB'); a = np.array(im).astype(int); H, W = a.shape[:2]
white = a.min(axis=2) > 235
def gap(prof, n):
    idx = [i for i in range(n) if prof[i] > 0.9 and n * 0.3 < i < n * 0.7]
    return (min(idx), max(idx)) if idx else (n // 2, n // 2)
cx0, cx1 = gap(white.mean(axis=0), W); cy0, cy1 = gap(white.mean(axis=1), H)
boxes = [(0, 0, cx0, cy0), (cx1 + 1, 0, W, cy0), (0, cy1 + 1, cx0, H), (cx1 + 1, cy1 + 1, W, H)]
for n, (x0, y0, x1, y1) in zip(names, boxes):
    if n == '-': continue
    p = im.crop((x0 + 2, y0 + 2, x1 - 2, y1 - 2))
    # 9:16로 맞춤(가운데 기준으로 넘치는 쪽만 자름)
    w, h = p.size
    if w / h > 9 / 16: nw = round(h * 9 / 16); p = p.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = round(w * 16 / 9); p = p.crop((0, h - nh, w, h))
    p.resize((720, 1280), Image.LANCZOS).save(f'{outdir}/{n}.jpg', quality=88, optimize=True)
    print(n, p.size)
