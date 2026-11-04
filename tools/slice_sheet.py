# 그리드 시트 → 개별 스프라이트
# 투명 PNG면 알파를 그대로, 흰 배경이면 테두리 바깥 흰색을 지움.
# 칸 경계를 넘는 그림이 있어도 잘리지 않게, 덩어리마다 중심이 속한 칸에 배정
import sys, numpy as np
from PIL import Image
from scipy import ndimage

OUT = np.array((35, 48, 77), np.float32)

def to_rgba(im):
    a = np.array(im.convert('RGBA')).astype(np.float32)
    if a[..., 3].min() < 250: return a  # 이미 투명 배경
    rgb = a[..., :3]
    near = rgb.min(axis=2) >= 236
    lab, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    alpha = np.where(bg, 0.0, 1.0)
    band = ndimage.binary_dilation(bg, iterations=2) & ~bg
    al = np.clip(((255 - rgb) / (255 - OUT)).max(axis=2), 0, 1)
    alpha[band] = al[band]
    m = band & (alpha > 0.02)
    rgb[m] = np.clip((rgb[m] - (1 - alpha[m])[:, None] * 255) / alpha[m][:, None], 0, 255)
    a[..., :3] = rgb; a[..., 3] = alpha * 255
    return a

def place(img, size, bottom=False, margin=0.06):
    img = img.crop(img.getbbox())
    w, h = img.size; inner = size * (1 - 2 * margin)
    s = inner / max(w, h); img = img.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    c = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    x = (size - img.width) // 2
    y = size - img.height - round(size * 0.02) if bottom else (size - img.height) // 2
    c.paste(img, (x, y), img); return c

def split(src, cols, rows):
    a = to_rgba(Image.open(src)); H, W = a.shape[:2]
    lab, n = ndimage.label(a[..., 3] > 8, structure=np.ones((3, 3)))
    cells = [np.zeros((H, W), bool) for _ in range(cols * rows)]
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        comp = lab[sl] == i
        if comp.sum() < 40: continue
        cy, cx = ndimage.center_of_mass(comp)
        cy += sl[0].start; cx += sl[1].start
        k = min(rows - 1, int(cy / H * rows)) * cols + min(cols - 1, int(cx / W * cols))
        cells[k][sl] |= comp
    out = []
    for m in cells:
        b = a.copy(); b[..., 3] *= m
        out.append(Image.fromarray(b.astype(np.uint8), 'RGBA'))
    return out

if __name__ == '__main__':
    src, cols, rows, names = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(',')
    for im, n in zip(split(src, cols, rows), names):
        if n == '-': continue
        # 256색으로 줄여 용량 약 1/7 (만화 그림이라 차이가 거의 안 보임)
        place(im, 512, bottom=n in ('puppy', 'big_dog')).quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(f'out/{n}.png', optimize=True)
        print(n, 'ok')
