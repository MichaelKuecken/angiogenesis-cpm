from cc3d.cpp.PlayerPython import * 
from cc3d import CompuCellSetup
from cc3d.core.PySteppables import *
import numpy as np

import scipy.ndimage as ndimage
import skimage.measure as measure
from skimage.morphology import medial_axis

class analysisSteppable(SteppableBasePy):

    def __init__(self, frequency=100):

        SteppableBasePy.__init__(self,frequency)
        self.create_scalar_field_py("Tracking")

    def start(self):
        """
        Called before MCS=0 while building the initial simulation
        """
        
        self.plot_win = self.add_new_plot_window(title='Distribution of lacunae A',
                                                 x_axis_title='Lacuna',
                                                 y_axis_title='Area', x_scale_type='linear', y_scale_type='linear',
                                                 grid=False)
        
        self.plot_win2 = self.add_new_plot_window(title='Distribution of struts widths',
                                                 x_axis_title='point',
                                                 y_axis_title='S Width', x_scale_type='linear', y_scale_type='linear',
                                                 grid=False)        
      
        self.plot_win.add_plot("ADist", style='Dots', color='green', size=3)
        
        self.plot_win2.add_plot("SWidth", style='Dots', color='red', size=3)
        
        

    def step(self, mcs):
        """
        Called every frequency MCS while executing the simulation
        
        :param mcs: current Monte Carlo step
        Domains over time (Histogram)
        Add total area of EC in contact with medium 
        Width of the vessels (mean & Histogram)
        """
        l_dim = 200
        i_img = np.ones((l_dim, l_dim), dtype=np.uint8)
        img = np.zeros((l_dim, l_dim), dtype=np.uint8)        
        tr_field = self.field.Tracking

                                        
        for x, y, z in self.every_pixel():
            # print("x,y,z=", (x, y, z))
            
            cell = self.cell_field[x, y, z]
            if cell:
                img[x,y] = 1 
                i_img[x,y] = 0
                tr_field[x, y, z] = 0
            else:
                img[x,y] = 0
                i_img[x,y] = 1
                tr_field[x, y, z] = 1

        if mcs>100:
            
            self.plot_win.erase_all_data()
            # Measure the lacunae
            labeled_image, num_labels = ndimage.label(i_img)
            regions = measure.regionprops(labeled_image)
            
            regions = sorted(regions, key=lambda x: x.area, reverse=True)
            for i, region in enumerate(regions, start=1):
                # Exclude regions touching the border of the image
                if region.bbox[0] == 0 or region.bbox[1] == 0 or region.bbox[2] == l_dim-1 or region.bbox[3] == l_dim-1:
                    continue
                # Get the coordinates of the centroid of the region
                y, x = region.centroid
                # Draw the area of the domain on the image
                if region.area > 10 and region.area < 2500:
                    self.plot_win.add_data_point("ADist", i, region.area)
                    
                    # To add perimeter and morphological metrics
                    # Width of the strouts
            # Measure the network
            skel, distance =  medial_axis(img, return_distance=True)
            dist_on_skel = distance * skel
            sort_px_list = np.sort(dist_on_skel.ravel())
            nonzero_pixels = sort_px_list[sort_px_list > 0]
            nonzero_pixels = nonzero_pixels[::-1]
            self.plot_win2.erase_all_data()
            for i, px in enumerate(nonzero_pixels, start=1):
                self.plot_win2.add_data_point("SWidth", i, px)

                    
                    
                    
                    


             
        