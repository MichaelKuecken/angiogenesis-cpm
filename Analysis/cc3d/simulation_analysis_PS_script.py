import numpy as np
from time import time # Useful to track execution time
import os # Work with system folders and files

from cc3d.CompuCellSetup.CC3DCaller import CC3DSimService # Needed to instantiate simulations

# Import plugins to be used in the simulation
from cc3d.core.PyCoreSpecs import (PottsCore, 
                                   Metadata, 
                                   CellTypePlugin,
                                   VolumePlugin, 
                                   CenterOfMassPlugin,
                                   NeighborTrackerPlugin,
                                   PixelTrackerPlugin, 
                                   ContactPlugin,
                                   ChemotaxisPlugin,
                                   ChemotaxisParameters,
                                   ChemotaxisTypeParameters,
                                   DiffusionSolverFE,
                                   UniformInitializer)

# Import widgets to visualize simulations in Jupyter Notebooks
from IPython.display import display
from cc3d.core.GraphicsUtils.JupyterGraphicsFrameWidget import CC3DJupyterGraphicsFrameGrid as cc3djgf
import ipywidgets
from tqdm import tqdm

# These are additional imports needed to run the simulation in parallel batch mode from python
# from VM_steppable import analysisSteppable
import json
from multiprocessing import Process, Queue

# Imprts needed for the analysis steppable
from cc3d.core.PySteppables import *

import scipy.ndimage as ndimage
import skimage.measure as measure
from skimage.morphology import medial_axis
from PIL import Image

class analysisSteppable(SteppableBasePy):
    """
    Steppable to analyse the simulation and store the results
    
    Parameters:
    ___________
    input_dict: dict
        Dictionary with the parameters used in the simulation

    output_dir: str
        Directory to store the results

    frequency: int
        Frequency to run the steppable

    Methods:
    ___________
    step(self, mcs) -> None
        Method to run the analysis at each MCS

    finish(self) -> dict
        Method to store the results of the analysis
    """
    def __init__(self, input_dict:dict, output_dir:str, frequency:int=100):
        self.input_dict = input_dict
        self.o_dir = output_dir

        SteppableBasePy.__init__(self,frequency)
    
    def step(self, mcs):
        pass

    def finish(self):
        # Create placeholder arrays to store the image and the inverted image 
        i_img = np.ones((200, 200), dtype=np.uint8)
        img = np.zeros((200, 200), dtype=np.uint8)        

        # Visit all the pixels in the lattice and assign the value of the cell field to the images                                        
        for x, y, z in self.every_pixel():
            
            cell = self.cell_field[x, y, z]
            if cell:
                img[x,y] = 1 
                i_img[x,y] = 0
            else:
                img[x,y] = 0
                i_img[x,y] = 1

        # Convert binary images to RGB
        img_rgb = np.stack((img * 255,) * 3, axis=-1)

        # Make the non-zeros pixels green
        img_rgb[img == 1] = [0, 255, 0]
        # Make the zero pixels white
        img_rgb[img == 0] = [255, 255, 255]
        
        # Convert the numpy array to a PIL image
        img_pil = Image.fromarray(img_rgb.astype(np.uint8))

        # Get the values of the parameters to be used in the image name
        input_values = list(self.input_dict.values())
        
        # create a string with the values of the parameters separated by underscores
        img_name = '_'.join(map(str, input_values))
        
        # Save the image        
        img_name = f'{self.o_dir}/Snap_{img_name}.png'
        img_pil.save(img_name)

        # Measure the lacunae
        labeled_image, num_labels = ndimage.label(i_img)
        regions = measure.regionprops(labeled_image)
        regions = sorted(regions, key=lambda x: x.area, reverse=True)
        area_list = []
        for i, region in enumerate(regions, start=1):       
            # Exclude regions touching the border of the image
            if region.bbox[0] == 0 or region.bbox[1] == 0 or region.bbox[2] == 399 or region.bbox[3] == 399:
                continue
            # Get the coordinates of the centroid of the region
            y, x = region.centroid

            # Filter out non-informative results
            if region.area > 10 and region.area < 10000:
                area_list.append(region.area)
        area_arr = np.array(area_list)

        # Measure the network
        skel, distance =  medial_axis(img, return_distance=True)
        dist_on_skel = distance * skel
        sort_px_list = np.sort(dist_on_skel.ravel())
        nonzero_pixels = sort_px_list[sort_px_list > 0]
        nonzero_pixels = nonzero_pixels[::-1]
        pix_array = np.array(nonzero_pixels)

        n_regions = area_arr.shape[0]
        mean_l_area = np.mean(area_arr) if n_regions > 0 else 0
        std_l_area = np.std(area_arr) if n_regions > 0 else 0

        return_obj = {**self.input_dict, "n_regions": n_regions,
                        "mean_l_area": mean_l_area, "std_l_area": std_l_area,
                        "len_network": pix_array.shape[0], "mean_n_width": np.mean(pix_array),
                        "std_n_width": np.std(pix_array)}
        CompuCellSetup.persistent_globals.return_object = return_obj

class AngioSim:
    """
    Class to run the Angiogenesis simulation as individual instances or in batch mode

    Methods:
    ___________
    __init__(self, me_ce:float=4.0, ee_ce:float=1.0, l_chemo:int=500, lin_sat_cf:float=0.1, ve_dir:float=1.0, ve_der:float=0.3, ve_sec:float=0.3, visualisation:bool=False) -> None
        Build the simulation with the a set of default parameters

    run(self, steps:int=1000) -> None
        Run the simulation for the given number of steps
    
    store_snapshot(self) -> None
        Store a snapshot of the simulation    
    """
    def __init__(self,
                 output_dir:str, 
                 me_ce:float=4.0,
                 ee_ce:float=1.0, 
                 l_chemo:int=500, 
                 lin_sat_cf:float=0.1,
                 ve_dir:float=1.0, 
                 ve_der:float=0.3, 
                 ve_sec:float=0.3,
                 visualisation:bool=False,
                 save_snapshot:bool=False,
                 ) -> None:
        """
        Build the simulation with the given parameters
        
        Parameters:
        ___________
        me_ce: float
            Contact energy between the medium and the endothelial cells
        ee_ce: float
            Contact energy between the endothelial cells
        l_chemo: int
            Chemotaxis lambda parameter
        lin_sat_cf: float
            Linear saturation coefficient of the VEGF field
        ve_dir: float
            Global VEGF diffusion rate
        ve_der: float
            Global VEGF decay rate
        ve_sec: float
            VEGF secretion rate by the endothelial cells
        visualisation: bool
            Whether to visualise the simulation
        save_snapshot: bool
            Whether to save a snapshot of the simulation (vtk file)
        """

        self.save_snap = save_snapshot
        self.params = {"me_ce": me_ce, 
                       "ee_ce": ee_ce, 
                       "l_chemo": l_chemo, 
                       "lin_sat_cf": lin_sat_cf, 
                       "ve_dir": ve_dir, 
                       "ve_der": ve_der, 
                       "ve_sec": ve_sec}
        # initialise the specs list
        self.specs = []

        self.output_dir = output_dir

        # https://compucell3dreferencemanual.readthedocs.io/en/latest/cc3d_python.html
        
        # Define the Potts Core Specs
        simCore = PottsCore(dim_x=200,
                            dim_y=200,
                            dim_z=1,
                            steps=10000,
                            fluctuation_amplitude=5.0,
                            neighbor_order=1,
                            boundary_x="Periodic",
                            boundary_y="Periodic")
        
        # Define the Metadata Specs
        simMeta = Metadata(num_processors=1)

        # Append the specs to the list
        self.specs.append(simCore)
        self.specs.append(simMeta)

        # Define the Cell Types in the simulation
        simCelltypes = CellTypePlugin("Medium", "EC")
        self.specs.append(simCelltypes)

        # Define the Volume Energy Specifcations
        simVolume = VolumePlugin()
        simVolume.param_new("EC", 50.0, 5.0) # Volume, target volume, lambda volume
        self.specs.append(simVolume)

        simCOM = CenterOfMassPlugin()
        self.specs.append(simCOM)

        simNtrack = NeighborTrackerPlugin()
        self.specs.append(simNtrack)

        simPXtrack = PixelTrackerPlugin()
        self.specs.append(simPXtrack)

        # Define the Contact Energy Specifications
        simContact = ContactPlugin(neighbor_order=4)
        simContact.param_new("Medium", "EC", me_ce) # Medium, EC, contact energy
        simContact.param_new("EC", "EC", ee_ce) # EC, EC, contact energy
        self.specs.append(simContact)

        # Define the Diffusion Solver Specifications
        simDiffusion = DiffusionSolverFE()

        # Define a new field for VEGF
        vegf = simDiffusion.field_new("VEGF")

        # Set the boundary conditions for the VEGF field (all periodic)
        bds = [('x', 'min'), ('x', 'max'), ('y', 'min'), ('y', 'max')]
        for bd in bds:
            setattr(vegf.bcs, f"{bd[0]}_{bd[1]}_type", 'Periodic')

        # Set the global diffusion and decay parameters for the VEGF field
        vegf.diff_data.diff_global = ve_dir
        vegf.diff_data.decay_global = ve_der
        # Set the decay parameters for the EC cells
        vegf.diff_data.decay_types["EC"] = 0.0
        # Set the secretion parameters for the EC cells
        vegf.secretion_data_new("EC", ve_sec)
        self.specs.append(simDiffusion)

        # Define the Chemotaxis specifications
        f = ChemotaxisParameters(field_name="VEGF", solver_name="DiffusionSolverFE")
        kwargs = {"lambda_chemo": l_chemo, "towards": "Medium", "linear_sat_cf": lin_sat_cf}
        p = ChemotaxisTypeParameters("EC", **kwargs)
        f.params_append(p)
        simChemotx = ChemotaxisPlugin(f)
        self.specs.append(simChemotx)

        # Define the initial layout of cells in the simulation
        simInit = UniformInitializer()
        simInit.region_new(pt_min=[1,1,0], pt_max=[199,199,1], width=7, gap=3, cell_types=['EC'])
        self.specs.append(simInit)

        # Instantiate the simulation service
        self.cc3d_sim = CC3DSimService(output_dir=self.output_dir)
        # Register the specs in the simulation service
        self.cc3d_sim.register_specs(self.specs)

        #!!!!!!!!!!
        # Register steppables in the simulation service
        self.cc3d_sim.register_steppable(analysisSteppable(input_dict=self.params, output_dir=self.output_dir), frequency=100)
        #!!!!!!!!!!

        # Run the simulation
        self.cc3d_sim.run()
        self.cc3d_sim.init()
        self.cc3d_sim.start()
        if visualisation:
            self.frame = self.cc3d_sim.visualize()
            self.frame.field_name = "VEGF"
            self.frame.max_range = 3.0
    
    def run(self, steps:int=1000) -> None:
        """
        Run the simulation for the given number of steps
        
        Parameters:
        ___________
        steps: int
            Number of steps to run the simulation for
        """
        for n in tqdm(range(0, steps)): # Note the use of tqdm to track progress     
            self.cc3d_sim.step()
        if self.save_snap:
            self.store_snapshot()
        self.cc3d_sim.finish()

    def store_snapshot(self) -> None:
        """
        Store the current snapshot of the simulation
        """
        # Create a string with the values of the parameters separated by underscores
        values_str = "_".join(map(str, self.params.values())) 
        name = f'snap_{values_str}'
        self.cc3d_sim.store_lattice_snapshot(output_dir_name=self.output_dir,output_file_core_name=name)

class AngioSimBatch:
    """
    Class to perform parameter sweeps in the Angiogenesis simulation 
    and run multiple instances in parallel

    Methods:
    ___________
    __init__(self, default_values:dict, p_ranges:np.ndarray ,steps:int, n_cpus:int=10) -> None
        Set the input and default values for the simulation
    
    instance_exec(self, input_vector:np.ndarray, queue:bool=False) -> None
        Run a single instance of the simulation
    
    run_batch_serial(self, samples:np.ndarray) -> list
        Run a batch of simulations in serial mode
    
    run_batch_parallel(self,samples:np.ndarray) -> np.ndarray
        Run a batch of simulations in parallel mode
    
    one_at_a_time_sample(self, param2sample:list[str], n:int=10) -> np.array
        Generate samples changing a single parameter at a time
    
    lhs_sampling(self, n_samples, params2sample:list[str])
        Generate samples using the Latin Hypercube Sampling method
    """
    def __init__(self, output_dir:str, default_values:dict, p_ranges:np.ndarray ,steps:int, n_cpus:int=10) -> None:
        """
        Set the input and default values for the simulation

        Parameters:
        ___________
        default_values: dict
            Dictionary with the default values of the parameters
        
        p_ranges: np.ndarray
            Array with the ranges of the parameters

        steps: int
            Number of steps to run the simulation for
        
        n_cpus: int
            Number of CPUs available to run the simulations in parallel
        """
        self.default_values = np.array(list(default_values.values()))
        self.param_names = list(default_values.keys())
        self.p_ranges = p_ranges
        self.steps = steps
        # self.n_cpus = n_cpus
        self.output_dir = output_dir 

    def instance_exec(self, input_vector:np.ndarray, queue:bool=False) -> None:
        out_dir = self.output_dir
        instance = AngioSim(output_dir=out_dir,
                            me_ce=input_vector[0], 
                            ee_ce=input_vector[1], 
                            l_chemo=input_vector[2], 
                            lin_sat_cf=input_vector[3], 
                            ve_dir=input_vector[4], 
                            ve_der=input_vector[5], 
                            ve_sec=input_vector[6])
        instance.run(steps=self.steps)
        if queue:
            queue.put(instance.cc3d_sim.sim_output)
        else:
            return instance.cc3d_sim.sim_output
 
    def run_batch_serial(self, samples:np.ndarray) -> list:
        results = []
        for sample in samples:
            results.append(self.instance_exec(sample))
        
        return results
    
    # !!!!!!!!!
    # _______________________________________________________
    def run_batch_parallel(self,samples:np.ndarray) -> np.ndarray:
        processes = []
        # Create a queue to store the results
        queue = Queue()
        for sample in samples:
            # Assign a process to run the simulation
            p = Process(target=self.instance_exec, args=(sample, queue))
            p.start()
            # Append the process to the list
            processes.append(p)
        
        for p in processes:
            # Wait for the process to finish then join it
            p.join()
        
        results = []
        # Get the results from the queue and write them to a list
        while not queue.empty():
            results.append(queue.get())

        # Convert the list to a numpy array
        arr_results = np.array(results)
        
        return arr_results
    # _______________________________________________________
    # !!!!!!!!!

    def one_at_a_time_sample(self, param2sample:list[str], n:int=10) -> np.array:  
        # impose the minimum number of samples to be 2 (no big deal sampling 1 point right?)
        n = n if n > 1 else 2
        
        all_samples = []
        for param in param2sample:
            # Generate an n dimensional array filled with default values
            samples = np.array([self.default_values for i in range(n)])
            idx = self.param_names.index(param)
            # Generate samples for the parameter
            sample = np.linspace(self.p_ranges[idx][0], self.p_ranges[idx][1], n)
            # Update the samples array with the new values (i.e., change the column corresponding to the parameter)
            samples[:,idx] = sample
            all_samples.append(samples)
    
        return np.vstack(all_samples)

    def lhs_sampling(self, n_samples, params2sample:list[str]):
        # Create an array filled with default values to hold the samples
        result = np.array([self.default_values for i in range(n_samples)]) 
        
        for param in params2sample:

            # Get the index of the parameter in the list of parameters
            idx = self.param_names.index(param)

            # Generate the intervals for the parameter from the parameter ranges
            intervals = np.linspace(self.p_ranges[idx][0], self.p_ranges[idx][1], n_samples)

            # Generate the samples for the parameter
            samples = np.random.uniform(intervals[:-1], intervals[1:], n_samples)

            # Shuffle the samples
            np.random.shuffle(samples)

            # Update the samples array with the new values (i.e., change the column corresponding to the parameter)
            result[:,idx] = samples
        
        return result
    
# !!!!!!!!!
# Define the main function to run the simulation in batch mode
# _______________________________________________________    
def main():
    """
    Main function to run the Angiogenesis simulation in batch mode    
    """
    default_values = {'me_ce': 4.0,
                  'ee_ce': 1.0,
                  'l_chemo': 500,
                  'lin_sat_cf': 0.1,
                  've_dir': 1.0,
                  've_der': 0.3,
                  've_sec': 0.3}

    p_ranges = np.array([[1.0, 5.0],
                        [0.0, 20.0],
                        [0, 600],
                        [0, 0.6],
                        [1, 10],
                        [0.0, 0.6],
                        [0.05, 0.5]])
    # !!!!!!!!!
    # Set number of steps to run the simulation for, the number of samples to generate, and the number of CPUs to use
    steps = 500
    n_samples = 6
    n_cpus = 5
    out_dir_name = 'results'    
    # !!!!!!!!!

    # Set the output directory name
    cur_dir = os.getcwd()
    results_dir = os.path.join(cur_dir, out_dir_name)

    # Create the results directory if it does not exist
    if not os.path.exists(results_dir):
        os.makedirs(results_dir)

    # Create an instance of the AngioSimBatch class
    batch = AngioSimBatch(output_dir=results_dir, default_values=default_values, p_ranges=p_ranges, steps=steps)

    # Generate samples using the Latin Hypercube Sampling method
    cases = batch.one_at_a_time_sample(param2sample=['lin_sat_cf','l_chemo'], n=n_samples)

    # Run the simulations in parallel
    
    results_list = []
    for j in range(0, len(cases), n_cpus):
        print(f'running batch {j} to {j+n_cpus-1}')  
        results_list.append(batch.run_batch_parallel(cases[j:j+n_cpus]))
    
    # Dump the results to a json file

    filename = os.path.join(cur_dir, f'results/res_ws.json')

    
    res_dict = {}
    for i, results in enumerate(results_list):    
        for j, res in enumerate(results):  
            res_dict[f"sim_{i}_{j}"] = res

    with open(filename, 'w') as f:
        json.dump(res_dict, f)

# _______________________________________________________
# End of the main function
# !!!!!!!!!

if __name__ == '__main__':
    main()