
from cc3d import CompuCellSetup
        

from angioSteppables import analysisSteppable

CompuCellSetup.register_steppable(steppable=analysisSteppable(frequency=100))


CompuCellSetup.run()
