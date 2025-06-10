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
                          required=True,
                          dest='script_path',
                          help='Absolute path to simulation script angiogenesis-simulation.js')

		self.add_argument('-f', '--file',
                          type=str,
                          required=True,
                          dest='spec_path',
                          help='Absolute path to .txt file with parameter screen')

		self.add_argument('-j', '--max_proc',
                          type=str,
                          default=2,
                          dest='max_proc',
                          help='Max number of cores used for parallel simulation runs. Default is 2.')

		self.add_argument('-i', '--image_path',
                          type=str,
                          default=0,
                          dest='image_path',
                          help='path to folder to store output images in.')
        
		self.add_argument('-n', '--nsim',
                          type=int,
                          default=1,
                          dest='nsim',
                          help='number of simulation replicates per parameter combination')        

		self.parsed_args = self.parse_args()

	@property
	def spec_path(self):
		return f'{os.getcwd()}/{self.parsed_args.spec_path}'
        
	@property
	def script_path(self):
		return f'{os.getcwd()}/{self.parsed_args.script_path}'

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
	def image_path(self) -> int:
		return self.parsed_args.image_path

	@property
	def kwargs(self):
		return dict(
			script=self.script_path,
			nsim = self.nsim,
			fp=self.spec_path,
			max_proc=self.max_proc,
			image_path=self.image_path
		)

args = ArgParser().kwargs


""" 
	=========================== Functions ===========================
"""

""" Function to run the node script for a given parameter set
"""
def run_node(parms) :

	parmString = ""
	for i in range( len( sim_table.columns ) ) :
		pName = sim_table.columns[i]
		pValue = parms[i+1]
		parmString += " -" + pName + " " + str( pValue )
	
	success = execute_js( args['script'], parmString )
	if success:
		pass
	else:
		raise NameError("error in node: " + parmString )


""" Parallel computation of the simulations at a given parameter combination
"""
def run_all():
	
    with mp.Pool( nProcessors ) as pool:
        result = pool.imap( run_node, theParms.itertuples(name=None), chunksize = 2 )
        output = pd.DataFrame()
        sims = 0
        for x in result:
            sims = sims+1

def expand_grid(dictionary):
    return pd.DataFrame([row for row in it.product(*dictionary.values())], columns=dictionary.keys())

"""
    =========================== SCRIPT ===========================
"""

parmTable = pd.read_table( args['fp'], sep = "\t" )
dictionary = {}
for col in parmTable.columns:
    dictionary[col] = parmTable[col].tolist()
dictionary['x'] = np.arange( args['nsim'] ) + 1
sim_table = expand_grid( dictionary )
sim_table['i'] = args['image_path']

if __name__ == '__main__':
    os.makedirs( args['image_path'], exist_ok = True )
    ntot = len( sim_table ) 
    nProcessors = args['max_proc']
    print( ".... Running simulations in parallel with " + str(nProcessors) + " cores; (change using -j [desired_cores])")
    with mp.Pool( nProcessors ) as p, tqdm( total = ntot) as pbar:
        for result in p.imap( run_node, sim_table.itertuples( name = None) ):
        	pbar.update()
        	pbar.refresh()

    