.SECONDARY:
.DELETE_ON_ERROR:

MAXPROC=6
NSIM=50
DATADIR=compare_multipleruns
# on the server this points to an external drive instead (e.g. datadir)
SCANS=chemstrength satstrength vegfdegr cellcell

all : allOrig allCC allSync allMph allCCN2 allCCN5

allOrig : $(foreach s, $(SCANS), .exps/orig-$(s))
allCC :  $(foreach s, $(SCANS), .exps/CC3D-$(s))
allCCN2 :  $(foreach s, $(SCANS), .exps/CC3DN2-$(s))
allCCN5 :  $(foreach s, $(SCANS), .exps/CC3DN5-$(s))
allSync :  $(foreach s, $(SCANS), .exps/sync-$(s))
allMph :  $(foreach s, $(SCANS), .exps/morpheus-$(s))

node_modules : 
	npm install
	
img : 
	mkdir -p $@
	
parms :
	mkdir -p $@
	
.exps :
	mkdir -p $@	

.exps-CC3D : 
	mkdir -p $@

# one example simulation
output/img/angiogenesis-Temp5-Jcm4-Jcc1-D1-prod0.3-decay0.3-sat0.1-lchem500-seed1-t0.png : src/angiogenesis-simulation.js | output/img node_modules
	  node $< -i output/img 
	  
# make parameter input files for experiments
parms/screen-chemstrength.txt : src/makeParamTable.R | parms
	Rscript $< 1 $@  "m 0 50 100 150 200 250 300 350 400 450 500 550 600" 
	
parms/screen-satstrength.txt : src/makeParamTable.R | parms
	Rscript $< 1 $@  "s 0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6" 

parms/screen-vegfdegr.txt : src/makeParamTable.R | parms
	Rscript $< 1 $@  "e 0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6" 

parms/screen-cellcell.txt : src/makeParamTable.R | parms
	Rscript $< 1 $@  "J 1 2 4 6 8 10 12 14 16" 
	
	
# Run experiments in parallel

.exps/orig-% : run.py src/angiogenesis-simulation.js parms/screen-%.txt | img node_modules .exps
	python run.py -s src/angiogenesis-simulation.js -f parms/screen-$*.txt -c Orig -i $(DATADIR)/ArtistooOrig/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@

.exps/CC3D-% : run.py src/angiogenesis-simulation.js parms/screen-%.txt | img node_modules .exps
	python run.py -s src/angiogenesis-simulation.js -f parms/screen-$*.txt -c CC3D -i $(DATADIR)/ArtistooCC3D/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@

.exps/CC3DN2-% : run.py src/angiogenesis-simulation-N2.js parms/screen-%.txt | img node_modules .exps
	python run.py -s src/angiogenesis-simulation-N2.js -f parms/screen-$*.txt -c CC3D -i $(DATADIR)/ArtistooCC3DN2/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@

.exps/CC3DN5-% : run.py src/angiogenesis-simulation-N5.js parms/screen-%.txt | img node_modules .exps
	python run.py -s src/angiogenesis-simulation-N5.js -f parms/screen-$*.txt -c CC3D -i $(DATADIR)/ArtistooCC3DN5/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@


.exps/sync-% : run.py src/angiogenesis-simulation.js parms/screen-%.txt | img node_modules .exps
	python run.py -s src/angiogenesis-simulation.js -f parms/screen-$*.txt -c Sync -i $(DATADIR)/ArtistooSync/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@

.exps/morpheus-% : run.py src/angiogenesis-simulation.js parms/screen-%.txt | img node_modules .exps
	python run.py -s src/angiogenesis-simulation.js -f parms/screen-$*.txt -c Morpheus -i $(DATADIR)/ArtistooMorpheus/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@
