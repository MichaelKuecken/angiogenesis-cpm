#!/usr/bin/env python3
"""
Compare verify/output (this folder's fast, reduced-parameter runs) against the
archived real experiment data in Analysis/full-comparison/compare_multipleruns,
to confirm angiogenesis-simulation.js still reproduces the same output as
before. Only t500 frames exist in the archived data (t0 was pruned there), so
only those are compared/shown.

Usage:
    python3 compare-to-analysis.py check <verify_dir> <analysis_dir>
        Byte-compares every matching *-t500.png file; prints a summary and
        exits 1 if any mismatch is found (exit 0 if only some are missing -
        that just means the analysis archive doesn't have that combination).

    python3 compare-to-analysis.py pdf <verify_dir> <analysis_dir> <out.tex>
        Writes a LaTeX file with side-by-side thumbnails of every matched
        pair, grouped by mode/scan, for a quick visual sanity check.
"""
import sys
import os
import glob
import filecmp

MODES = ["ArtistooOrig", "ArtistooCC3D", "ArtistooCC3DN2", "ArtistooCC3DN5", "ArtistooSync", "ArtistooMorpheus"]
SCANS = ["chemstrength", "satstrength", "vegfdegr", "cellcell"]


def find_pairs(verify_dir, analysis_dir):
    """ Returns a list of (mode, scan, basename, verify_path, analysis_path)
    for every *-t500.png under verify_dir; analysis_path is None if no
    matching file exists in analysis_dir. """
    pairs = []
    for mode in MODES:
        for scan in SCANS:
            vdir = os.path.join(verify_dir, mode, f"{scan}_scan")
            adir = os.path.join(analysis_dir, mode, f"{scan}_scan")
            if not os.path.isdir(vdir):
                continue
            for vf in sorted(glob.glob(os.path.join(vdir, "*-t500.png"))):
                base = os.path.basename(vf)
                af = os.path.join(adir, base)
                pairs.append((mode, scan, base, vf, af if os.path.isfile(af) else None))
    return pairs


def check(verify_dir, analysis_dir):
    pairs = find_pairs(verify_dir, analysis_dir)
    n_match = n_mismatch = n_missing = 0
    for mode, scan, base, vf, af in pairs:
        if af is None:
            n_missing += 1
            print(f"MISSING IN ANALYSIS: {mode}/{scan}_scan/{base}")
        elif filecmp.cmp(vf, af, shallow=False):
            n_match += 1
        else:
            n_mismatch += 1
            print(f"MISMATCH: {mode}/{scan}_scan/{base}")
    print(f"\n{n_match} matched, {n_mismatch} mismatched, {n_missing} missing (of {len(pairs)} verify t500 files)")
    return 1 if n_mismatch else 0


def make_pdf(verify_dir, analysis_dir, out_tex):
    pairs = find_pairs(verify_dir, analysis_dir)
    lines = [
        r"\documentclass[10pt]{article}",
        r"\usepackage{graphicx}",
        r"\usepackage[margin=1.5cm]{geometry}",
        r"\pagestyle{empty}",
        r"\setlength{\parindent}{0pt}",
        r"\begin{document}",
    ]
    current_group = None
    for mode, scan, base, vf, af in pairs:
        group = (mode, scan)
        if group != current_group:
            if current_group is not None:
                lines.append(r"\newpage")
            lines.append(r"\section*{%s -- %s\_scan}" % (mode, scan))
            lines.append(r"{\bfseries\small\hspace{2.7cm}Verify\hspace{2.7cm}Analysis}\par")
            current_group = group
        label = base[len("angiogenesis"):-len("-t500.png")]
        vimg = os.path.abspath(vf)
        lines.append(r"\texttt{\scriptsize %s}\par" % label)
        if af is not None:
            aimg = os.path.abspath(af)
            lines.append(r"\includegraphics[width=2.6cm]{%s}\hspace{0.3cm}\includegraphics[width=2.6cm]{%s}\par" % (vimg, aimg))
        else:
            lines.append(r"\includegraphics[width=2.6cm]{%s}\hspace{0.3cm}\textit{missing}\par" % vimg)
        lines.append(r"\vspace{0.2cm}")
    lines.append(r"\end{document}")
    with open(out_tex, "w") as f:
        f.write("\n".join(lines) + "\n")
    n_groups = len(set((m, s) for m, s, _, _, _ in pairs))
    print(f"Wrote {out_tex} with {len(pairs)} pairs across {n_groups} groups")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(2)
    cmd = sys.argv[1]
    if cmd == "check":
        sys.exit(check(sys.argv[2], sys.argv[3]))
    elif cmd == "pdf":
        if len(sys.argv) < 5:
            print(__doc__)
            sys.exit(2)
        make_pdf(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        print(__doc__)
        sys.exit(2)
