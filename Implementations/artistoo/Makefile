.SECONDARY:
.DELETE_ON_ERROR:

MAXPROC=4
NSIM=10

all : .exps/lchem .exps/satcoef .exps/VEGFdecay .exps/Jcc

node_modules : 
	npm install
	
img : 
	mkdir -p $@
	
parms :
	mkdir -p $@
	
.exps :
	mkdir -p $@	

# one example simulation
output/img/angiogenesis-Temp5-Jcm4-Jcc1-D1-prod0.3-decay0.3-sat0.1-lchem500-seed1-t0.png : src/angiogenesis-simulation.js | output/img node_modules
	  node $< -i output/img 
	  
# make parameter input files for experiments
parms/screen-lchem.txt : src/makeParamTable.R | parms
	Rscript $< 1 $@  "m 0 50 100 150 200 250 300 350 400 450 500 550 600" 
	
parms/screen-satcoef.txt : src/makeParamTable.R | parms
	Rscript $< 1 $@  "s 0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6" 

parms/screen-VEGFdecay.txt : src/makeParamTable.R | parms
	Rscript $< 1 $@  "e 0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6" 

parms/screen-Jcc.txt : src/makeParamTable.R | parms
	Rscript $< 1 $@  "J 1 2 4 6 8 10 12 14 16" 
	
	
# Run experiments in parallel

.exps/% : run.py src/angiogenesis-simulation.js parms/screen-%.txt | img node_modules .exps
	python run.py -s src/angiogenesis-simulation.js -f parms/screen-$*.txt -i img/screen-$* -n $(NSIM) -j $(MAXPROC) && touch $@

