from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen


UNITS_PER_EM = 1200
CELL = 100
ADVANCE_WIDTH = 1200
FAMILY_NAME = "EndingMemoryManualPatch"
OUTPUT = Path(__file__).resolve().parents[1] / "fonts" / "ending-memory-manual-patch.ttf"


# 12x12 pixel grids, aligned to ArkPixel12ZhCn's 1200-unit Chinese glyph box.
# Each entry only covers a glyph missing from the visible ending-memory copy.
GLYPHS = {
    0x561B: [  # ma
        "............",
        "....#.......",
        "###.########",
        "#.#..#...#..",
        "#.#..#...#..",
        "#.#.#######.",
        "#.#..#...#..",
        "#.#..##.##..",
        "###..##.###.",
        ".....#.#.#.#",
        "....#..#...#",
        "...#...#...#",
    ],
    0x5E55: [  # mu
        "............",
        "...#...#....",
        "###########.",
        "...#...#....",
        ".#########..",
        ".#.......#..",
        ".#########..",
        "....#.#.....",
        "###########.",
        "#....#....#.",
        ".#...#...##.",
        ".....#......",
    ],
    0x6559: [  # jiao
        "............",
        "....#..#....",
        ".#####.#....",
        "....#..#####",
        "########..#.",
        "....#.#..#..",
        "..#####..#..",
        ".#...#.#.#..",
        "#...##.#.#..",
        "..####..#...",
        "....#..#.#..",
        "..###.#...##",
    ],
    0x7136: [  # ran
        "............",
        "..####...#..",
        "..#..#...#.#",
        "..####.#####",
        "..#..#...#..",
        ".######.#.#.",
        ".#..#.#.#.#.",
        ".#..#.##...#",
        "..##........",
        "............",
        ".#.#..#..#..",
        "#...#..#..#.",
    ],
    0x7B14: [  # bi
        "............",
        ".#....#.....",
        ".####.#####.",
        "#..#.#..#...",
        ".....####...",
        "#####.......",
        "....######..",
        "#####.......",
        "....#######.",
        "#####.......",
        "....#.....#.",
        ".....######.",
    ],
    0x7B51: [  # zhu
        "............",
        ".#....#.....",
        ".####.#####.",
        "#..#.#..#...",
        ".#####.#####",
        "...#....#...",
        "...#.#####..",
        "...#.#...#..",
        "#########...",
        "...#.#.#....",
        "..#..#.#..#.",
        "##..#...###.",
    ],
}


def glyph_from_rows(rows):
    pen = TTGlyphPen(None)
    for row_index, row in enumerate(rows):
        y0 = 1000 - row_index * CELL
        y1 = y0 + CELL
        col = 0
        while col < 12:
            if row[col] != "#":
                col += 1
                continue
            start = col
            while col < 12 and row[col] == "#":
                col += 1
            x0 = start * CELL
            x1 = col * CELL
            pen.moveTo((x0, y0))
            pen.lineTo((x1, y0))
            pen.lineTo((x1, y1))
            pen.lineTo((x0, y1))
            pen.closePath()
    return pen.glyph()


def empty_glyph():
    return TTGlyphPen(None).glyph()


def validate_glyphs():
    for codepoint, rows in GLYPHS.items():
        if len(rows) != 12 or any(len(row) != 12 for row in rows):
            raise ValueError(f"U+{codepoint:04X} must use a 12x12 grid")
        invalid = {pixel for row in rows for pixel in row} - {".", "#"}
        if invalid:
            raise ValueError(f"U+{codepoint:04X} has invalid pixels: {invalid}")


def build_font():
    validate_glyphs()

    glyph_order = [".notdef"] + [f"u{codepoint:04X}" for codepoint in GLYPHS]
    glyphs = {".notdef": empty_glyph()}
    for codepoint, rows in GLYPHS.items():
        glyphs[f"u{codepoint:04X}"] = glyph_from_rows(rows)

    metrics = {name: (ADVANCE_WIDTH, 0) for name in glyph_order}
    cmap = {codepoint: f"u{codepoint:04X}" for codepoint in GLYPHS}

    font = FontBuilder(UNITS_PER_EM, isTTF=True)
    font.setupGlyphOrder(glyph_order)
    font.setupCharacterMap(cmap)
    font.setupGlyf(glyphs)
    font.setupHorizontalMetrics(metrics)
    font.setupHorizontalHeader(ascent=1300, descent=-300, lineGap=0)
    font.setupOS2(
        sTypoAscender=1300,
        sTypoDescender=-300,
        sTypoLineGap=0,
        usWinAscent=1300,
        usWinDescent=300,
        sxHeight=700,
        sCapHeight=1000,
        xAvgCharWidth=1200,
        usWeightClass=400,
        usWidthClass=5,
    )
    font.setupNameTable(
        {
            "familyName": FAMILY_NAME,
            "styleName": "Regular",
            "uniqueFontIdentifier": f"{FAMILY_NAME} Regular 1.0",
            "fullName": f"{FAMILY_NAME} Regular",
            "psName": f"{FAMILY_NAME}-Regular",
            "version": "Version 1.0",
        }
    )
    font.setupPost()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    font.save(OUTPUT)
    print(f"Generated {OUTPUT} with {len(GLYPHS)} glyphs")


if __name__ == "__main__":
    build_font()
