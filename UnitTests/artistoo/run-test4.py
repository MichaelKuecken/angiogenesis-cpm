# packages from standard lib
import sys
import os
import glob

# packages in conda env.yml
import numpy as np
import pandas as pd
from Naked.toolshed.shell import execute_js, execute
import argparse

class ArgParser(argparse.ArgumentParser):
    
	def __init__(self):
		super().__init__(description='Execute specification with Artistoo')

		self.add_argument('-s', '--script',
                          type=str,
                          required=False,
                          dest='script_path',
                          default = "src/angiogenesis-test4.js", 
                          help='simulation script')

		self.add_argument('-o', '--out',
                          type=str,
                          required=False,
                          dest='out_path',
                          default="output/test4/artistoo-test4.csv",
                          help='Path to output csv')


		self.parsed_args = self.parse_args()
        
	@property
	def script_path(self):
		return f'{os.getcwd()}/{self.parsed_args.script_path}'

	@property
	def out_path(self):
		return f'{os.getcwd()}/{self.parsed_args.out_path}'

	@property
	def kwargs(self):
		return dict(
			script=self.script_path,
			out=self.out_path
		)

args = ArgParser().kwargs

""" 
	=========================== Functions ===========================
"""

""" Function to run the node script for a given replicate / simulation seed
"""
def run_node() :

	argString = " > " + args['out']
	#print(script + " " + argString)
	success = execute_js(args['script'], argString ) #execute_js(args['script'], argString )
	if success:
		pass
	else:
		raise NameError("error in node: " + argString )




"""
    =========================== SCRIPT ===========================
"""

   
if __name__ == '__main__':
    os.makedirs( "output/test4", exist_ok = True )
    print( " Running simulation...")
    run_node()
    print( " Done!")
 