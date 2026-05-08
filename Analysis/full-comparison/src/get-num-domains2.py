"""
get_num_domains.py

Network analysis on a binary PNG image.
Can be used as an importable module (preferred) or run standalone:

    python get_num_domains.py <image_path> <min_size> <framework_name>
"""

import re
import sys
import warnings

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure, morphology
from skimage.morphology import medial_axis
from skan import Skeleton, summarize


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def distance_from_uniform(seq): # measure how much a distribution differs from a uniform distribution
    array = np.array(seq)
    summe = sum(seq)
    avg = summe/len(seq)
    absdevarray = abs(array-avg)
    summe2 = sum(absdevarray)
    if summe > 0 :
    	return summe2/summe
    else:
    	return np.nan


def load_binary_image(filepath): # open PNG and return 2D bool array
    image = np.array(Image.open(filepath))
    if image.ndim > 2:
        return image[:, :, 0] > 0
    return image.astype(bool)


# ---------------------------------------------------------------------------
# Core analysis
# ---------------------------------------------------------------------------

def analyze_image(image, min_size=10):
    """
    Run network analysis on a 2-D binary image.

    Parameters
    ----------
    image    : 2-D bool/uint8 numpy array
    min_size : minimum region area (pixels) to count as a lacuna

    Returns
    -------
    dict with keys:
        mean_n_width, lacunae_number, total_network_length,
        number_of_branches, anisotropy
    """
    dimx, dimy = image.shape

    # smooth with 10x erosion -> dilation passes
    binary_image = image.copy()
    for _ in range(10):
        image = morphology.erosion(image)
        image = morphology.dilation(image)

    # medial axis + local width
    skel, distance = medial_axis(image, return_distance=True)
    dist_on_skel = distance * skel
    nonzero = np.sort(dist_on_skel.ravel())
    nonzero = nonzero[nonzero > 0][::-1]          # descending
    mean_n_width = float(np.mean(nonzero)) if nonzero.size else np.nan

    # count lacunae (connected components of the original image interior)
    labeled_image, _ = ndimage.label(binary_image)
    regions = measure.regionprops(labeled_image)

    lacunae_number = 0
    for region in regions:
        bb = region.bbox                           # (min_row, min_col, max_row, max_col)
        interior = bb[0] > 0 and bb[2] < dimx and bb[1] > 0 and bb[3] < dimy
        if region.area > min_size and interior:
            lacunae_number += 1

    # skeleton of the background network via skan
    skeleton = morphology.skeletonize(~image)
    branch_data = summarize(Skeleton(skeleton), separator="-")
    branch_data = branch_data.rename(columns={
        "branch-type":     "branchtype",
        "branch-distance": "branchdistance",
    })

    # keep only junction-to-junction branches of meaningful length
    branch_data.drop(branch_data[branch_data.branchtype != 2].index, inplace=True) # drop branches that are not from junction to junction
    branch_data.drop(branch_data[branch_data.branchdistance < 5.].index, inplace=True) # drop small branches

    # branch orientation, folded into [0, pi)
    branch_data["angle"] = np.arctan2(
        branch_data["image-coord-src-1"] - branch_data["image-coord-dst-1"],
        branch_data["image-coord-src-0"] - branch_data["image-coord-dst-0"],
    ).astype(float)

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        #branch_data.loc[branch_data["angle"] < 0.0, "angle"] += np.pi
        branch_data.loc[branch_data['angle'] < 0.] = branch_data.loc[branch_data['angle'] < 0.] + np.pi

    total_network_length = float(branch_data["branchdistance"].sum())
    number_of_branches   = int(branch_data.shape[0])
    frequencies          = np.histogram(branch_data["angle"], bins=20)[0]
    anisotropy           = distance_from_uniform(frequencies)

    return dict(
        mean_n_width         = mean_n_width,
        lacunae_number       = lacunae_number,
        total_network_length = total_network_length,
        number_of_branches   = number_of_branches,
        anisotropy           = anisotropy,
    )


# ---------------------------------------------------------------------------
# Standalone entry point (kept for backward compatibility)
# ---------------------------------------------------------------------------

def _basename(filepath):
    name = filepath
    while "/" in name:
        name = re.sub(r"^.*?/", "", name)
    return name


def main():
    if len(sys.argv) != 4:
        print("Usage: python get_num_domains.py <image> <min_size> <framework>",
              file=sys.stderr)
        sys.exit(1)

    filepath, min_size_str, framework = sys.argv[1], sys.argv[2], sys.argv[3]
    results = analyze_image(load_binary_image(filepath), min_size=int(min_size_str))

    print(
        f"{framework},{_basename(filepath)},{min_size_str},"
        f"{results['lacunae_number']},"
        f"{results['mean_n_width']},"
        f"{results['total_network_length']},"
        f"{results['number_of_branches']},"
        f"{results['anisotropy']}"
    )


if __name__ == "__main__":
    main()