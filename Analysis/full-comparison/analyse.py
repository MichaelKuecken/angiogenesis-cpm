import sys
import numpy as np
#import pandas as pd
from Naked.toolshed.shell import execute
import os
import glob
from tqdm import tqdm
import multiprocessing as mp
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
                          help='path to analysis python script')

		self.add_argument('-i', '--input_folder',
                          type=str,
                          required=True,
                          dest='input_folder',
                          help='Folder where pngs are located')

		self.add_argument('-j', '--max_proc',
                          type=str,
                          default=2,
                          dest='max_proc',
                          help='Max number of cores used for parallel analysis. Default is 2.')

		self.add_argument('-o', '--out_csv',
                          type=str,
                          required=True,
                          dest='out_csv',
                          help='will contain the data.')
        
		self.add_argument('-w', '--which',
                          type=str,
                          required=True,
                          dest='which',
                          help='framework name, must be "Artistoo", "Morpheus", or "CC3D"')        

		self.parsed_args = self.parse_args()

	@property
	def input_folder(self):
		return f'{os.getcwd()}/{self.parsed_args.input_folder}'
        
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
	def which(self):
		return  self.parsed_args.which

	@property
	def out_csv(self):
		return self.parsed_args.out_csv

	@property
	def kwargs(self):
		return dict(
			script=self.script_path,
			out_csv = self.out_csv,
			input_folder=self.input_folder,
			max_proc=self.max_proc,
			which = self.which
		)

args = ArgParser().kwargs

outFile = args['out_csv']

""" 
	=========================== settings ===========================
"""



minRegionSizes = (0,10)


def run_analysis( f ) :
	for m in minRegionSizes:
		commandString = "python " + args['script'] + " " + f + " " + str(m) + " " + args['which'] + " >> " + outFile
		success = execute( commandString )
		if success:
			pass
		else : 
			raise NameError("error in command: " + commandString )
	

if __name__ == '__main__':
    files = glob.glob( args['input_folder'] + "/*.png" ) 
    execute( f"echo 'framework,file,minSize,N,Nwidth,networkLength,nBranches,anisotropy' > {outFile}" )
    ntot = len( files ) 
    nProcessors = args['max_proc']
    print( ".... Running analysis in parallel with " + str(args['max_proc']) + " cores; (change using -j [desired_cores])")
    with mp.Pool( nProcessors ) as p, tqdm( total = ntot) as pbar:
        for result in p.imap( run_analysis, files ):
        	pbar.update()
        	pbar.refresh()