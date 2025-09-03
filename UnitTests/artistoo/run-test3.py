# packages from standard lib
import sys
import os
import glob

# packages in conda env.yml
import numpy as np
import pandas as pd
from Naked.toolshed.shell import execute_js, execute


""" 
	=========================== Functions ===========================
"""

""" Function to run the node script for a given replicate / simulation seed
"""
def run_node() :

	argString = " > output/test3/artistoo-test3.csv" 
	#print(script + " " + argString)
	success = execute_js("src/angiogenesis-test3.js", argString ) #execute_js(args['script'], argString )
	if success:
		pass
	else:
		raise NameError("error in node: " + argString )




"""
    =========================== SCRIPT ===========================
"""

   
if __name__ == '__main__':
    os.makedirs( "output/test3", exist_ok = True )
    print( " Running simulation...")
    run_node()
    print( " Done!")
 