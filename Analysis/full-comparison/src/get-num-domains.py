import skimage as ski
from skimage.morphology import medial_axis
from skimage.morphology import convex_hull_image
from skimage import measure

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import PIL.ImageOps
from random import uniform
from scipy import ndimage
import pandas as pd

from skimage import morphology
from skan import Skeleton, summarize
from skan import draw

import sys
import re

# Settings from command line
inFile = sys.argv[1]
minSize = int( sys.argv[2] )
who = sys.argv[3]


outFileString = inFile 
while '/' in outFileString :
	outFileString = re.sub(r'^.*?/', '', outFileString)



filename =inFile


def distance_from_uniform(seq): # measure how much a distribution differs from a uniform distribution
    array = np.array(seq)
    summe = sum(seq)
    avg = summe/len(seq)
    absdevarray = abs(array-avg)
    summe2 = sum(absdevarray)
    return summe2/summe
    
def analyze_image(image):

    (dimx, dimy) = image.shape
    
    for i in range(0, 10):
      image = ski.morphology.erosion(image)
      # Dilate one pixel
      image = ski.morphology.dilation(image)

    skel, distance =  medial_axis(image, return_distance=True)
    # keep only the distances (local width) on the skeleton
    dist_on_skel = distance * skel

	# Keep only the non zero values, invert to have highest values first
    sort_px_list = np.sort(dist_on_skel.ravel())
    nonzero_pixels = sort_px_list[sort_px_list > 0]
    nonzero_pixels = nonzero_pixels[::-1]    
    mean_n_width = np.mean(nonzero_pixels)
 
    # Label the connected components
    labeled_image, num_labels = ndimage.label(binary_image)

    # Get properties of labeled regions
    regions = measure.regionprops(labeled_image)

    lacunaenumber = 0

    for i, region in enumerate(regions, start=1):
        # Get the coordinates of the centroid of the region
        y, x = region.centroid
        bb = region.bbox
        # Draw the area of the domain on the image
        if region.area > minSize and bb[0]>0 and bb[2]<dimx and bb[1]>0 and bb[3]<dimy:  
     #      ax2.text(x, y, str(region.area), color='white')
           lacunaenumber += 1    

    # Determine skeleton and analyze network using skan library
    #print(type(image))
    skeleton0 = morphology.skeletonize(~image)
    branch_data = summarize(Skeleton(skeleton0), separator = '-')
    branch_data = branch_data.rename(columns={"branch-type": "branchtype"})
    branch_data = branch_data.rename(columns={"branch-distance": "branchdistance"})
    branch_data.drop(branch_data[branch_data.branchtype != 2].index, inplace=True) # drop branches that are not from junction to junction
    branch_data.drop(branch_data[branch_data.branchdistance < 5.].index, inplace=True) # drop small branches

    # find direction of the branch
    branch_data['angle'] = np.arctan2(branch_data['image-coord-src-1']-branch_data['image-coord-dst-1'], branch_data['image-coord-src-0']-branch_data['image-coord-dst-0'])
    branch_data['angle'] = branch_data['angle'].astype('float')
    import warnings
    with warnings.catch_warnings(action="ignore"):
        branch_data.loc[branch_data['angle']<0.] = branch_data.loc[branch_data['angle']<0.] + np.pi
    #print(branch_data['angle'])
    total_network_length = branch_data['branchdistance'].sum()
    number_of_branches = branch_data.shape[0]

    # branch_data['angle'].hist(bins=20)

    hist = np.histogram(branch_data['angle'], bins=20)
    frequencies = hist[0]
    anisotropy = distance_from_uniform(frequencies)

    return mean_n_width, lacunaenumber, total_network_length, number_of_branches, anisotropy


# Read image data with PIL  (Python Imaging Library)
image = Image.open(filename)

# Turn image to array
image = np.array(image)

binary_image = image

# Binarise the image and turn in 2d
if image.ndim > 2 :
	binary_image = image[:,:,0] > 0


mean_n_width, Nr, total_network_length, number_of_branches, anisotropy = analyze_image( binary_image )

# Print the number of connected domains
print(f'{who},{outFileString},{minSize},{Nr},{mean_n_width},{total_network_length},{number_of_branches},{anisotropy}')


# # Label the connected components
# labeled_image, num_labels = ndimage.label(binary_image)
# 
# # Get properties of labeled regions
# regions = measure.regionprops(labeled_image)
# 
# fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 7))
# 
# # Display the original image
# ax1.imshow(original_image, cmap='gray')
# # Display the labeled image
# ax2.imshow(labeled_image, cmap='rainbow')
# ax1.axis('off')
# ax2.axis('off')
# 
# # Print the area of each domain on the image
# for i, region in enumerate(regions, start=1):
#     # Get the coordinates of the centroid of the region
#     y, x = region.centroid
#     # Draw the area of the domain on the image
#     if region.area > 10:
#        ax2.text(x, y, str(region.area), color='white')
# 
# plt.savefig( outFile )
# 
# props = pd.DataFrame( measure.regionprops_table(
#     labeled_image,
#     properties=('centroid','area')
# ) )
# 
# props = props[props['area'] >= minSize ]
# Nr = len( props ) 
# 
# # Print the number of connected domains
# print(f'{outFileString},{Nr},{minSize}')
