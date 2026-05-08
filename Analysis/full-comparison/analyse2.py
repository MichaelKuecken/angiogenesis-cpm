"""
analyse.py

Apply get_num_domains.analyze_image to a folder of PNGs in parallel,
writing results to a CSV. Heavy library imports happen once per worker
process rather than once per image.

Usage:
    python analyse.py -s src/get_num_domains.py \
                      -i compare_multipleruns/ArtistooCC3D/cellcell_scan \
                      -w ArtistooCC3D \
                      -o data/ArtistooCC3D-cellcell.csv \
                      -j 4
"""

import argparse
import csv
import glob
import importlib.util
import multiprocessing as mp
import os
import re
import sys

from tqdm import tqdm


# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(description="Batch PNG network analysis")
    parser.add_argument("-s", "--script",   required=True,  dest="script_path",
                        help="Path to get_num_domains.py")
    parser.add_argument("-i", "--input",    required=True,  dest="input_folder",
                        help="Folder containing PNG images")
    parser.add_argument("-o", "--out-csv",  required=True,  dest="out_csv",
                        help="Output CSV path")
    parser.add_argument("-w", "--which",    required=True,  dest="which",
                        help="Framework name (e.g. ArtistooCC3D)")
    parser.add_argument("-j", "--jobs",     default=2,      dest="max_proc",
                        type=int,
                        help="Number of parallel worker processes (default: 2)")
    args = parser.parse_args()

    # resolve to absolute paths
    args.script_path  = os.path.abspath(args.script_path)
    args.input_folder = os.path.abspath(args.input_folder)
    args.max_proc     = min(args.max_proc, mp.cpu_count())
    return args


# ---------------------------------------------------------------------------
# Worker initialiser — runs ONCE per process, not once per image
# ---------------------------------------------------------------------------

_analyzer = None   # module-level handle, set in each worker

def _init_worker(script_path):
    """Import the analysis module once per worker process."""
    global _analyzer
    spec = importlib.util.spec_from_file_location("get_num_domains", script_path)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    _analyzer = mod


# ---------------------------------------------------------------------------
# Per-image task
# ---------------------------------------------------------------------------

def _basename(filepath):
    name = filepath
    while "/" in name:
        name = re.sub(r"^.*?/", "", name)
    return name


def _run_one(task):
    """Analyse a single (filepath, min_size, framework) triple."""
    filepath, min_size, framework = task
    binary_image = _analyzer.load_binary_image(filepath)
    results      = _analyzer.analyze_image(binary_image, min_size=min_size)
    return (
        framework,
        _basename(filepath),
        min_size,
        results["lacunae_number"],
        results["mean_n_width"],
        results["total_network_length"],
        results["number_of_branches"],
        results["anisotropy"],
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

MIN_REGION_SIZES = (10,)

CSV_HEADER = [
    "framework", "file", "minSize",
    "N", "Nwidth", "networkLength", "nBranches", "anisotropy",
]


def main():
    args  = parse_args()
    files = sorted(glob.glob(os.path.join(args.input_folder, "*.png")))

    if not files:
        print(f"No PNG files found in {args.input_folder}", file=sys.stderr)
        sys.exit(1)

    tasks = [
        (f, m, args.which)
        for f in files
        for m in MIN_REGION_SIZES
    ]

    print(
        f"Analysing {len(files)} image(s) × {len(MIN_REGION_SIZES)} minSize value(s) "
        f"= {len(tasks)} task(s) on {args.max_proc} core(s)."
    )

    with open(args.out_csv, "w", newline="") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(CSV_HEADER)

        with mp.Pool(
            processes   = args.max_proc,
            initializer = _init_worker,        # heavy imports: once per worker
            initargs    = (args.script_path,),
        ) as pool, tqdm(total=len(tasks)) as pbar:

            for result in pool.imap_unordered(_run_one, tasks):
                writer.writerow(result)
                csvfile.flush()                # single writer — no race condition
                pbar.update()

    print(f"Done. Results written to {args.out_csv}")


if __name__ == "__main__":
    main()