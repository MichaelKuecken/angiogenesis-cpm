.SECONDARY:
.DELETE_ON_ERROR:

# Quick smoke test for src/angiogenesis-simulation.js after porting it to the
# build-simulation.js builder: same experiment matrix as ../Makefile (same
# 4 screens x 6 modes), but far cheaper - NSIM=2 instead of 50, and each
# screen only sweeps 3 randomly-picked values instead of its full range.
# Not meant to reproduce real experiment data, just to confirm nothing is
# broken. Output goes to verify/output, entirely separate from the real
# ../compare_multipleruns / datadir experiment output.

MAXPROC=6
NSIM=2
DATADIR=output
SCANS=chemstrength satstrength vegfdegr cellcell
ANALYSISDIR=../../../Analysis/full-comparison/compare_multipleruns
# not vendored in the repo - fetched on demand by ../Makefile, pinned to a
# tagged release
ARTISTOO_LIB=../src/artistoo-cjs.js

.PHONY: all allOrig allCC allCCN2 allCCN5 allSync allMph compare compare-pdf

all : allOrig allCC allSync allMph allCCN2 allCCN5

allOrig : $(foreach s, $(SCANS), .exps/orig-$(s))
allCC :  $(foreach s, $(SCANS), .exps/CC3D-$(s))
allCCN2 :  $(foreach s, $(SCANS), .exps/CC3DN2-$(s))
allCCN5 :  $(foreach s, $(SCANS), .exps/CC3DN5-$(s))
allSync :  $(foreach s, $(SCANS), .exps/sync-$(s))
allMph :  $(foreach s, $(SCANS), .exps/morpheus-$(s))

img :
	mkdir -p $@

$(ARTISTOO_LIB) :
	$(MAKE) -C .. src/artistoo-cjs.js

parms :
	mkdir -p $@

.exps :
	mkdir -p $@

# reduced parameter files: 3 randomly-picked values from each screen's full
# range in ../Makefile (picked once for reproducibility, not re-randomized
# per run)
parms/screen-chemstrength.txt : ../src/makeParamTable.R | parms
	Rscript $< 1 $@  "m 50 150 600"

parms/screen-satstrength.txt : ../src/makeParamTable.R | parms
	Rscript $< 1 $@  "s 0.0 0.1 0.3"

parms/screen-vegfdegr.txt : ../src/makeParamTable.R | parms
	Rscript $< 1 $@  "e 0.2 0.25 0.35"

parms/screen-cellcell.txt : ../src/makeParamTable.R | parms
	Rscript $< 1 $@  "J 1 12 14"


# Run experiments in parallel

.exps/orig-% : ../run.py ../src/angiogenesis-simulation.js parms/screen-%.txt | img .exps $(ARTISTOO_LIB)
	python ../run.py -s ../src/angiogenesis-simulation.js -f parms/screen-$*.txt -c Orig -i $(DATADIR)/ArtistooOrig/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@

.exps/CC3D-% : ../run.py ../src/angiogenesis-simulation.js parms/screen-%.txt | img .exps $(ARTISTOO_LIB)
	python ../run.py -s ../src/angiogenesis-simulation.js -f parms/screen-$*.txt -c CC3D -i $(DATADIR)/ArtistooCC3D/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@

.exps/CC3DN2-% : ../run.py ../src/angiogenesis-simulation.js parms/screen-%.txt | img .exps $(ARTISTOO_LIB)
	python ../run.py -s ../src/angiogenesis-simulation.js -f parms/screen-$*.txt -c CC3D -N 2 -i $(DATADIR)/ArtistooCC3DN2/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@

.exps/CC3DN5-% : ../run.py ../src/angiogenesis-simulation.js parms/screen-%.txt | img .exps $(ARTISTOO_LIB)
	python ../run.py -s ../src/angiogenesis-simulation.js -f parms/screen-$*.txt -c CC3D -N 5 -i $(DATADIR)/ArtistooCC3DN5/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@

.exps/sync-% : ../run.py ../src/angiogenesis-simulation.js parms/screen-%.txt | img .exps $(ARTISTOO_LIB)
	python ../run.py -s ../src/angiogenesis-simulation.js -f parms/screen-$*.txt -c Sync -i $(DATADIR)/ArtistooSync/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@

.exps/morpheus-% : ../run.py ../src/angiogenesis-simulation.js parms/screen-%.txt | img .exps $(ARTISTOO_LIB)
	python ../run.py -s ../src/angiogenesis-simulation.js -f parms/screen-$*.txt -c Morpheus -i $(DATADIR)/ArtistooMorpheus/$*_scan -n $(NSIM) -j $(MAXPROC) && touch $@


# Byte-compare every matching *-t500.png in $(DATADIR) against the archived
# real experiment data in $(ANALYSISDIR), to confirm nothing has drifted -
# rerun this yourself any time after further refactoring src/*.js.
compare :
	python3 compare-to-analysis.py check $(DATADIR) $(ANALYSISDIR)

# Generate a PDF with side-by-side thumbnails (verify vs. analysis) of every
# matched pair, grouped by mode/scan, for a quick visual check.
compare-pdf :
	python3 compare-to-analysis.py pdf $(DATADIR) $(ANALYSISDIR) compare.tex
	pdflatex -interaction=nonstopmode -halt-on-error compare.tex
