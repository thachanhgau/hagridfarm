#!/usr/bin/env python3
"""Filesystem-only audit for garden-v05 care animation assets.

This intentionally does not open a browser or run the garden page. It checks
PNG bytes, source-atlas provenance, native geometry, motion metadata, and
preservation hashes for the pre-existing level/master assets.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

from PIL import Image

EXPECTED_IDS = ["mooncalf", "kneazle", "diricawl", "fwooper", "thestral", "unicorn"]
EXPECTED_CLIPS = {
    "idle": {"frames": [4, 5, 4], "loop": True},
    "eat": {"frames": [6, 6, 4, 6], "loop": False},
    "care": {"frames": [7, 4, 7, 4], "loop": False},
}
EXPECTED_BASE_FRAME_COUNT = 4
EXPECTED_CARE_FRAME_COUNT = 4
THRESHOLD = 192


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def alpha_bounds(image: Image.Image, threshold: int = THRESHOLD) -> dict[str, Any]:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    xs: list[int] = []
    ys: list[int] = []
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] >= threshold:
                xs.append(x)
                ys.append(y)
    if not xs:
        return {"x": 0, "y": 0, "w": 0, "h": 0, "count": 0, "edge": False}
    x0, x1 = min(xs), max(xs)
    y0, y1 = min(ys), max(ys)
    return {
        "x": x0,
        "y": y0,
        "w": x1 - x0 + 1,
        "h": y1 - y0 + 1,
        "count": len(xs),
        "edge": x0 == 0 or y0 == 0 or x1 == width - 1 or y1 == height - 1,
    }


def source_cell(image: Image.Image, rect: dict[str, int]) -> dict[str, Any]:
    left, top = rect["x"], rect["y"]
    right, bottom = left + rect["w"], top + rect["h"]
    crop = image.crop((left, top, right, bottom))
    return {"rect": rect, "bounds": alpha_bounds(crop)}


def rgb_palette(palette: list[str]) -> set[tuple[int, int, int]]:
    return {
        tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))
        for value in (entry.lstrip("#").upper() for entry in palette)
    }


def frame_pixel_audit(path: Path, palette: set[tuple[int, int, int]]) -> dict[str, Any]:
    image = Image.open(path).convert("RGBA")
    alpha_values: set[int] = set()
    non_palette: list[tuple[int, int, int]] = []
    rgba = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = rgba[x, y]
            alpha_values.add(a)
            if a == 255 and (r, g, b) not in palette:
                if (r, g, b) not in non_palette:
                    non_palette.append((r, g, b))
    bounds = alpha_bounds(image)
    return {
        "sha256": sha256(path),
        "dimensions": {"width": image.width, "height": image.height},
        "alphaValues": sorted(alpha_values),
        "binaryAlpha": alpha_values <= {0, 255},
        "palette24": not non_palette,
        "nonPaletteColors": ["#%02X%02X%02X" % color for color in non_palette[:12]],
        "bounds": bounds,
        "nonEmpty": bounds["count"] > 0,
        "edgeContact": bounds["edge"],
    }


def preservation_audit(root: Path, baseline_path: Path) -> dict[str, Any]:
    baseline = load_json(baseline_path)
    records = []
    missing = []
    changed = []
    for rel, expected in sorted(baseline.get("files", {}).items()):
        path = root / rel
        if not path.is_file():
            missing.append(rel)
            records.append({"file": rel, "status": "missing"})
            continue
        current = sha256(path)
        status = "preserved" if current == expected.get("sha256") else "changed"
        record = {"file": rel, "status": status, "sha256": current, "expectedSha256": expected.get("sha256")}
        records.append(record)
        if status == "changed":
            changed.append(rel)
    return {
        "baselinePath": str(baseline_path),
        "baselineFileCount": len(baseline.get("files", {})),
        "missing": missing,
        "changed": changed,
        "preservedCount": sum(record["status"] == "preserved" for record in records),
        "pass": not missing and not changed,
        "files": records,
    }


def validate(root: Path) -> dict[str, Any]:
    manifest_path = root / "care-assets-manifest.json"
    level_manifest_path = root / "level-assets.json"
    motion_manifest_path = root / "motion-data.json"
    manifest = load_json(manifest_path)
    level_manifest = load_json(level_manifest_path)
    motion_manifest = load_json(motion_manifest_path)
    palette = rgb_palette(motion_manifest["palette"])
    issues: list[str] = []
    cautions: list[str] = []

    if manifest.get("palette") != motion_manifest.get("palette"):
        issues.append("care manifest palette differs from motion-data.json palette")
    if manifest.get("alphaThreshold") != motion_manifest.get("alphaThreshold"):
        issues.append("care manifest alpha threshold differs from motion-data.json")
    if manifest.get("itemCount") != len(EXPECTED_IDS):
        issues.append(f"expected {len(EXPECTED_IDS)} care items, found {manifest.get('itemCount')}")
    actual_ids = [item.get("id") for item in manifest.get("items", [])]
    if actual_ids != EXPECTED_IDS:
        issues.append(f"care item order/ids mismatch: {actual_ids}")

    level_items = {item["id"]: item for item in level_manifest.get("items", [])}
    item_reports: list[dict[str, Any]] = []
    for item in manifest.get("items", []):
        item_id = item.get("id")
        item_issues: list[str] = []
        level_item = level_items.get(item_id)
        if level_item is None:
            item_issues.append("missing matching level-assets item")
            item_reports.append({"id": item_id, "issues": item_issues})
            issues.extend(f"{item_id}: {message}" for message in item_issues)
            continue

        frames = item.get("frames", [])
        if len(frames) != EXPECTED_CARE_FRAME_COUNT:
            item_issues.append(f"expected four care frames, found {len(frames)}")
        if len(level_item.get("frames", [])) != EXPECTED_BASE_FRAME_COUNT:
            item_issues.append("matching level item does not have four growth frames")
        growth = item.get("growthPreserved", {})
        if growth.get("frames") != [0, 1, 2, 3]:
            item_issues.append(f"growth frame indices changed: {growth.get('frames')}")
        if len(growth.get("durations", [])) != 4 or any(not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0 for value in growth.get("durations", [])):
            item_issues.append("growth timings are not four finite positive values")

        clips = item.get("clips", {})
        clip_reports: dict[str, Any] = {}
        for clip_name, expected in EXPECTED_CLIPS.items():
            clip = clips.get(clip_name)
            if not isinstance(clip, dict):
                item_issues.append(f"missing {clip_name} clip")
                continue
            if clip.get("frames") != expected["frames"]:
                item_issues.append(f"{clip_name} frames mismatch: {clip.get('frames')}")
            durations = clip.get("durations")
            if not isinstance(durations, list) or len(durations) != len(expected["frames"]) or any(not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0 for value in durations):
                item_issues.append(f"{clip_name} durations must be finite positive values matching frames")
            if clip.get("loop") is not expected["loop"]:
                item_issues.append(f"{clip_name} loop expected {expected['loop']}, found {clip.get('loop')}")
            clip_reports[clip_name] = clip

        base_path = root / level_item["frames"][3]["file"]
        base_hash = sha256(base_path) if base_path.is_file() else None
        if base_hash != item.get("baseFrameSha256"):
            item_issues.append("base adult frame hash does not match care manifest")
        base_image = Image.open(base_path).convert("RGBA") if base_path.is_file() else None
        base_bounds = alpha_bounds(base_image) if base_image else None
        if base_bounds != item.get("baseBounds"):
            item_issues.append("base adult alpha bounds differ from care manifest")

        canvas = item.get("canvas", {})
        frame_reports: list[dict[str, Any]] = []
        item_edge_frames: list[str] = []
        for index, frame in enumerate(frames):
            frame_path = root / frame.get("file", "")
            if not frame_path.is_file():
                item_issues.append(f"missing care frame file {frame.get('file')}")
                continue
            audit = frame_pixel_audit(frame_path, palette)
            dimensions_match = audit["dimensions"] == {"width": canvas.get("width"), "height": canvas.get("height")}
            pivot_match = frame.get("pivotX") == canvas.get("pivotX") and frame.get("pivotY") == canvas.get("pivotY")
            bounds_match = audit["bounds"] == frame.get("bounds")
            no_clip = frame.get("clippedPixels") == 0
            baseline_match = audit["bounds"]["count"] > 0 and audit["bounds"]["y"] + audit["bounds"]["h"] == frame.get("pivotY")
            center_delta = abs((audit["bounds"]["x"] * 2 + audit["bounds"]["w"]) / 2 - frame.get("pivotX", 0))
            horizontal_anchor_match = center_delta <= 1.0
            frame_pass = all((
                dimensions_match,
                pivot_match,
                audit["binaryAlpha"],
                audit["palette24"],
                audit["nonEmpty"],
                not audit["edgeContact"],
                bounds_match,
                no_clip,
                baseline_match,
                horizontal_anchor_match,
            ))
            if not frame_pass:
                item_issues.append(f"frame {index + 1} failed geometry/PNG audit")
            if audit["edgeContact"]:
                item_edge_frames.append(frame_path.as_posix())
            frame_reports.append({
                "file": frame["file"],
                "careFrame": frame.get("careFrame"),
                "audit": audit,
                "dimensionsMatchCanvas": dimensions_match,
                "pivotMatchCanvas": pivot_match,
                "boundsMatchManifest": bounds_match,
                "noClip": no_clip,
                "baselineAtPivot": baseline_match,
                "horizontalAnchor": {"centerDelta": center_delta, "pass": horizontal_anchor_match},
                "pass": frame_pass,
            })

        if len(frames) == 4:
            scales = [frame.get("scale") for frame in frames]
            if any(not isinstance(value, (int, float)) or not math.isclose(value, item.get("neutralScale"), rel_tol=0, abs_tol=1e-12) for value in scales):
                item_issues.append("care frames do not use one constant neutral-derived scale")
            neutral_h = frames[0].get("bounds", {}).get("h")
            eat_h = frames[2].get("bounds", {}).get("h")
            if isinstance(neutral_h, int) and isinstance(eat_h, int) and eat_h > neutral_h + 1:
                item_issues.append(f"eat frame is taller than neutral by more than one pixel ({eat_h}>{neutral_h})")
            if frames[2].get("baseline", {}).get("anchor") != "source alpha-bounds bottom to native pivotY":
                item_issues.append("eat frame baseline anchor metadata missing")
        source_frames = item.get("frames", [])
        source_cuts: list[dict[str, Any]] = []
        for frame in source_frames:
            rect = frame.get("sourceRect", {})
            source_bounds = frame.get("sourceBounds", {})
            source_cuts.append({
                "careFrame": frame.get("careFrame"),
                "rect": rect,
                "bounds": source_bounds,
                "edgeContact": source_bounds.get("edge", False),
            })
            if rect.get("w") != 362 or rect.get("x") not in (0, 362, 724, 1086) or not 0 <= rect.get("y", -1) < 1086 or not 0 < rect.get("h", 0) <= 1086 - rect.get("y", 0):
                item_issues.append(f"source cut is outside the atlas columns or height: {rect}")

        atlas = item.get("atlas", {})
        atlas_path = root / atlas.get("file", "")
        if not atlas_path.is_file():
            item_issues.append(f"missing copied atlas {atlas.get('file')}")
        else:
            if sha256(atlas_path) != atlas.get("sourceSha256"):
                item_issues.append(f"copied atlas hash mismatch for {atlas.get('file')}")
            source_path = Path(atlas.get("sourcePath", ""))
            if source_path.is_file() and sha256(source_path) != atlas.get("sourceSha256"):
                item_issues.append(f"supplied source atlas hash changed for {source_path}")
            if source_path.is_file() and sha256(source_path) != sha256(atlas_path):
                item_issues.append(f"copied atlas differs from supplied source for {source_path}")
            source_image = Image.open(atlas_path).convert("RGBA")
            for frame in source_frames:
                actual_bounds = source_cell(source_image, frame["sourceRect"])["bounds"]
                if actual_bounds != frame["sourceBounds"] or actual_bounds["edge"]:
                    item_issues.append("source cut clips alpha or differs from measured bounds")
            if source_image.size != (1448, 1086):
                item_issues.append(f"atlas dimensions changed: {source_image.size}")

        if item.get("warnings"):
            cautions.extend(f"{item_id}: {warning}" for warning in item["warnings"])
        item_reports.append({
            "id": item_id,
            "label": item.get("label"),
            "neutralScale": item.get("neutralScale"),
            "canvas": canvas,
            "sourceEdgeContact": any(frame.get("sourceBounds", {}).get("edge") for frame in frames),
            "sourceCuts": source_cuts,
            "outputEdgeFrames": item_edge_frames,
            "clips": clip_reports,
            "frames": frame_reports,
            "issues": item_issues,
            "pass": not item_issues and len(frame_reports) == 4,
        })
        issues.extend(f"{item_id}: {message}" for message in item_issues)

    baseline_path = root / "qa-care" / "original-preservation-baseline.json"
    preservation = preservation_audit(root, baseline_path) if baseline_path.is_file() else {"pass": False, "missing": [str(baseline_path)], "changed": []}
    if not preservation.get("pass"):
        issues.append("original native/master preservation baseline failed")

    source_reports = []
    for atlas in manifest.get("sourceAtlases", []):
        path = root / atlas["file"]
        image = Image.open(path).convert("RGBA") if path.is_file() else None
        alpha_values = [index for index, count in enumerate(image.getchannel("A").histogram()) if count] if image else []
        source_reports.append({
            "file": atlas.get("file"),
            "sourcePath": atlas.get("sourcePath"),
            "sha256": sha256(path) if path.is_file() else None,
            "manifestSha256": atlas.get("sourceSha256"),
            "dimensions": {"width": image.width, "height": image.height} if image else None,
            "alphaValueCount": len(alpha_values),
            "sourceAlphaBinary": set(alpha_values) <= {0, 255},
            "pass": path.is_file() and sha256(path) == atlas.get("sourceSha256") and image is not None and image.size == (1448, 1086),
        })

    all_frames_pass = all(item.get("pass") for item in item_reports) and len(item_reports) == len(EXPECTED_IDS)
    source_pass = all(report["pass"] for report in source_reports) and len(source_reports) == 2
    result = {
        "version": 1,
        "status": "PASS" if not issues and all_frames_pass and source_pass and preservation.get("pass") else "FAIL",
        "scope": "filesystem-only care asset QA; no browser claim",
        "root": str(root),
        "manifest": str(manifest_path),
        "expected": {"species": EXPECTED_IDS, "items": 6, "frames": 24},
        "actual": {"items": len(manifest.get("items", [])), "frames": sum(len(item.get("frames", [])) for item in manifest.get("items", []))},
        "paletteSource": str(motion_manifest_path),
        "paletteExact": manifest.get("palette") == motion_manifest.get("palette"),
        "threshold": manifest.get("alphaThreshold"),
        "sourceAtlases": source_reports,
        "items": item_reports,
        "preservation": preservation,
        "cautions": sorted(set(cautions)),
        "issues": issues,
    }
    return result


def markdown(result: dict[str, Any]) -> str:
    lines = [
        f"# Garden v05 care asset audit: {result['status']}",
        "",
        "Filesystem-only verification. This report does not claim browser rendering or interaction proof.",
        "",
        f"- Scope: {result['actual']['items']} species / {result['actual']['frames']} care PNG frames.",
        f"- Palette: exact match to `motion-data.json`: `{result['paletteExact']}`; alpha threshold `{result['threshold']}`.",
        f"- Original level/master preservation: `{result['preservation'].get('pass')}` ({result['preservation'].get('preservedCount', 0)}/{result['preservation'].get('baselineFileCount', 0)} hashes preserved).",
        f"- Contact sheet: [`contact-sheet.html`](./contact-sheet.html).",
        "- Runtime data contract: [`runtime-contract-check.json`](./runtime-contract-check.json) is a separate VM-only check; it confirms eight frames per target, growth `[0,1,2,3]`, and the requested idle/eat/care clips.",
        "",
        "## Species",
        "",
        "| Species | Canvas/pivot | Neutral scale | Output edge/clipping | Clips/timing | Result |",
        "| --- | --- | ---: | --- | --- | --- |",
    ]
    for item in result["items"]:
        canvas = item.get("canvas", {})
        edge = len(item.get("outputEdgeFrames", []))
        clip_ok = all(frame.get("noClip") for frame in item.get("frames", []))
        timing_ok = all(
            clip.get("frames") == EXPECTED_CLIPS[name]["frames"]
            and len(clip.get("durations", [])) == len(clip.get("frames", []))
            and all(isinstance(value, (int, float)) and math.isfinite(value) and value > 0 for value in clip.get("durations", []))
            for name, clip in item.get("clips", {}).items()
            if name in EXPECTED_CLIPS
        )
        lines.append(f"| `{item['id']}` | {canvas.get('width')}×{canvas.get('height')} / {canvas.get('pivotX')},{canvas.get('pivotY')} | {item.get('neutralScale', 0):.6f} | edge frames {edge}; clipped `{not clip_ok}` | finite `{timing_ok}` | `{item.get('pass')}` |")
    lines.extend(["", "## Cautions", ""])
    if result["cautions"]:
        lines.extend(f"- {caution}" for caution in result["cautions"])
    else:
        lines.append("- None.")
    lines.extend(["", "## Issues", ""])
    if result["issues"]:
        lines.extend(f"- {issue}" for issue in result["issues"])
    else:
        lines.append("- None.")
    lines.extend([
        "",
        "## Re-run",
        "",
        "```sh",
        "PYTHON=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
        "ROOT=/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/garden-v05",
        "$PYTHON $ROOT/qa-care/verify_care_assets.py --root $ROOT",
        "```",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    result = validate(root)
    output_dir = root / "qa-care"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "care-asset-audit.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    (output_dir / "care-asset-audit.md").write_text(markdown(result), encoding="utf-8")
    print(json.dumps({"status": result["status"], "issues": result["issues"], "cautions": result["cautions"], "preserved": result["preservation"].get("preservedCount")}, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
