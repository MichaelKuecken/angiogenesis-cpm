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
                          default = "src/test3-4.js",
                          help='simulation script')

		self.add_argument('-o', '--out',
                          type=str,
                          required=False,
                          dest='out_path',
                          default="output/test4/artistoo-test4.csv",
                          help='Path to output csv')

		self.add_argument('-c', '--mode',
                          type=str,
                          required=False,
                          dest='mode',
                          default="",
                          help='chemokine update mode to pass through to the script (Orig, Sync, CC3D, Morpheus)')


		self.parsed_args = self.parse_args()

	@property
	def script_path(self):
		return f'{os.getcwd()}/{self.parsed_args.script_path}'

	@property
	def out_path(self):
		return f'{os.getcwd()}/{self.parsed_args.out_path}'

	@property
	def mode(self):
		return self.parsed_args.mode

	@property
	def kwargs(self):
		return dict(
			script=self.script_path,
			out=self.out_path,
			mode=self.mode
		)

args = ArgParser().kwargs

""" 
	=========================== Functions ===========================
"""

""" Function to run the node script for a given replicate / simulation seed
"""
def run_node() :

	# Test 4 is Test 3's script (src/test3-4.js) with D = 0 and the
	# measurement point at (100,100) instead of (80,80).
	argString = " -D 0 -p 100" + (" -c " + args['mode'] if args['mode'] else "") + " > " + args['out']
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
 