# packages from standard lib
import sys
import multiprocessing as mp 
import os
import glob
import itertools as it

# packages in conda env.yml
import numpy as np
import pandas as pd
from Naked.toolshed.shell import execute_js, execute
from tqdm import tqdm

import argparse



""" 
	=========================== settings ===========================
"""

class ArgParser(argparse.ArgumentParser):
    
	def __init__(self):
		super().__init__(description='Execute specification with Artistoo')

		self.add_argument('-s', '--script',
                          type=str,
                          required=False,
                          dest='script_path',
                          default = "src/angiogenesis-test2.js",
                          help='simulation script')

		self.add_argument('-j', '--max_proc',
                          type=str,
                          default=2,
                          dest='max_proc',
                          help='Max number of cores used for parallel simulation runs. Default is 2.')

		self.add_argument('-n', '--nsim',
                          type=int,
                          default=100,
                          dest='nsim',
                          help='number of simulation replicates per parameter combination')        

		self.add_argument('-o', '--out',
                          type=str,
                          required=False,
                          dest='out_path',
                          default="output/test2/artistoo-test2.csv",
                          help='Path to output csv')


		self.parsed_args = self.parse_args()
        
	@property
	def script_path(self):
		return f'{os.getcwd()}/{self.parsed_args.script_path}'

	@property
	def out_path(self):
		return f'{os.getcwd()}/{self.parsed_args.out_path}'


	@property
	def max_proc(self) -> int:
		value = int( self.parsed_args.max_proc )
		np = mp.cpu_count()
		if value > np : 
			value = np
		return value
		
	@property
	def nsim(self) -> int:
		return int( self.parsed_args.nsim )


	@property
	def kwargs(self):
		return dict(
			script=self.script_path,
			out=self.out_path,
			nsim = self.nsim,
			max_proc=self.max_proc
		)

args = ArgParser().kwargs


""" 
	=========================== Functions ===========================
"""

""" Function to run the node script for a given replicate / simulation seed
"""
def run_node(seed) :

	argString = " -x " + str(seed) + " > " + "output/test2/tracks" + "/track" + str(seed) +".csv" 
	#print(script + " " + argString)
	success = execute_js(args["script"], argString ) #execute_js(args['script'], argString )
	if success:
		pass
	else:
		raise NameError("error in node: " + argString )


""" Parallel computation of the simulation replicates
"""
def run_all():
	
    with mp.Pool( nProcessors ) as pool:
        result = pool.imap( run_node, theParms.itertuples(name=None), chunksize = 2 )
        output = pd.DataFrame()
        sims = 0
        for x in result:
            sims = sims+1


def merge_all():
    source_files = sorted( os.listdir( "output/test2/tracks" ) )
    dataframes = []
    for file in source_files:
        df = pd.read_csv("output/test2/tracks/"+ file) 
        dataframes.append(df)
    df_all = pd.concat(dataframes)
    return df_all


"""
    =========================== SCRIPT ===========================
"""


   
if __name__ == '__main__':
    nsim = int( args['nsim'] )
    sims = np.arange( nsim ) + 1
    os.makedirs( "output/test2/tracks", exist_ok = True )
    nProcessors = args['max_proc']
    print( ".... Running simulations in parallel with " + str(nProcessors) + " cores; (change using -j [desired_cores])")
    with mp.Pool( nProcessors ) as p, tqdm( total = nsim) as pbar:
        #p.map(run_node, sims )
        for result in p.imap( run_node, sims):
        	pbar.update()
        	pbar.refresh()
    out = merge_all()
    out_name = args['out']
    out.to_csv(out_name, index=False) 
    print( " Done!")
 