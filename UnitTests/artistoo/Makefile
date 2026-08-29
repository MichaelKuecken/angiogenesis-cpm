MODES=Orig Sync CC3D Morpheus
SCALES=1 2
# not vendored in the repo - fetched on demand by ../../Implementations/artistoo/Makefile,
# pinned to a tagged release
ARTISTOO_LIB=../../Implementations/artistoo/src/artistoo-cjs.js

.PHONY: all test1 test2 test3 test4 test5 test3-scaling test3b-equaldecay test4b-onlydiff

$(ARTISTOO_LIB) :
	$(MAKE) -C ../../Implementations/artistoo src/artistoo-cjs.js

all : test1 test2 test3 test4 test5

test1 : output/test1/artistoo-test1.csv output/test1/artistoo-test1-b.csv

# test1b and test2b just use a different neighborhood from spec to show the test analysis 
# can pick this up. 
output/test1/artistoo-test1.csv : src/test1.js | $(ARTISTOO_LIB)
	python run-test1.py -o $@

output/test1/artistoo-test1-b.csv : src/test1.js | $(ARTISTOO_LIB)
	python run-test1.py -b -o $@

test2 : output/test2/artistoo-test2.csv output/test2/artistoo-test2-b.csv

output/test2/artistoo-test2.csv : src/test2.js | $(ARTISTOO_LIB)
	python run-test2.py -o $@

output/test2/artistoo-test2-b.csv : src/test2.js | $(ARTISTOO_LIB)
	python run-test2.py -b -o $@


# Do test3 on several operator ordering "modes"; 'Orig' is the one in the first 
# Artistoo implementation that was made; 'Sync' is the new default, the other two
# are to verify this really explains the difference with the other software implementations.
test3 : $(foreach m, $(MODES), output/test3/artistoo-test3-$(m).csv)

output/test3/artistoo-test3-%.csv : src/test3-4.js | $(ARTISTOO_LIB)
	python run-test3.py -c $* -o $@

test4 : $(foreach m, $(MODES), output/test4/artistoo-test4-$(m).csv)

output/test4/artistoo-test4-%.csv : src/test3-4.js | $(ARTISTOO_LIB)
	python run-test4.py -c $* -o $@

test5 : $(foreach m, $(MODES), output/test5/artistoo-test5-$(m).csv)

output/test5/artistoo-test5-%.csv : src/test5.js | $(ARTISTOO_LIB)
	python run-test5.py -c $* -o $@

# spatial resolution scaling test, all 4 modes; not part of `all` since
# higher f gets heavy fast (roughly f^2 grid area x f^2 diffusion substeps).
test3-scaling : $(foreach m, $(MODES), $(foreach s, $(SCALES), output/test3-scaling/artistoo-test3-$(m)-f$(s).csv))

output/test3-scaling/artistoo-test3-Orig-f%.csv : src/test3-4.js | $(ARTISTOO_LIB)
	python run-test3.py -c Orig -f $* -o $@

output/test3-scaling/artistoo-test3-Sync-f%.csv : src/test3-4.js | $(ARTISTOO_LIB)
	python run-test3.py -c Sync -f $* -o $@

output/test3-scaling/artistoo-test3-CC3D-f%.csv : src/test3-4.js | $(ARTISTOO_LIB)
	python run-test3.py -c CC3D -f $* -o $@

output/test3-scaling/artistoo-test3-Morpheus-f%.csv : src/test3-4.js | $(ARTISTOO_LIB)
	python run-test3.py -c Morpheus -f $* -o $@

# Test 3 with decay applied everywhere (not gated at the source), for
# comparison against the analytical ODE solution on the mass output. Not
# part of `all` since it's a deviation from the spec for comparison purposes
# only, not one of the numbered unit tests.
test3b-equaldecay : $(foreach m, $(MODES), output/test3b/artistoo-test3b-$(m).csv)

output/test3b/artistoo-test3b-%.csv : src/test3b-equaldecay.js | $(ARTISTOO_LIB)
	mkdir -p output/test3b
	node src/test3b-equaldecay.js -c $* > $@

# Pure diffusion kernel (no secretion/decay, single pulse). Not part of
# `all` since it's a diagnostic, not one of the numbered unit tests.
test4b-onlydiff : output/test4b/artistoo-test4b.csv

output/test4b/artistoo-test4b.csv : src/test4b-onlydiff.js | $(ARTISTOO_LIB)
	mkdir -p output/test4b
	node src/test4b-onlydiff.js > $@
