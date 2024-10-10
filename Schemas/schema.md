# Schema for the Angiogenesis Model

## Object types
    Universe

### Cells 
    Endothelial Cells 
	
### Fields 
    Chemical Field VEGF
	
## Biological processes
### Behaviors (Autonomous to individual Objects)

    Random Cell Motility
        CONTROL PARAMETERS:
            Degree of Autonomous Cell Motility
            Diffusion Rate of Isolated Cells 
            Fluctuation Amplitude
    
    Cell connectivity constraint (Yes/No)

    Cell Volume (exclusion)
        CONTROL PARAMETERS:
            Cell Size

    Compressibility

    Cell shape 
        CONTROL PARAMETERS:
            Cell Elongation/Aspect Ratio

### Diffusion/Decay of chemical field
    CONTROL PARAMETERS:
        Diffusion Constant of chemical field in cells and medium
        Decay rate of chemical field in cells and medium

    Note Key control parameter is diffusion length/cell radius


### Interactions Between Objects of the Same Class
    Cell-cell adhesivity
	    CONTROL PARAMETERS:
            Tissue Surface Tension (Difference in contact energy between cell-cell and ½ cell-medium)


### Interactions Between Objects of Different Classes
    Chemotaxis of cells to chemical field
        CONTROL PARAMETERS:
            Strength of Response of Cell to Chemical
            Linear Response to Chemical Field [].
            Contact inhibition of chemotaxis (Boolean)

    Secretion of chemical field by cells
        CONTROL PARAMETERS:
            Rate of Secretion of Chemical by Cells

## Physics and maths (diffusion, PDEs, boolean modeling)

### Dynamics and events
	Cells: 
        Dynamics:
            Overdamped Force/velocity
            Random motility
        Events:
	        None

    Fields:
	    Dynamics:
            Diffusion Equation
        Events:
	        None

## Initial conditions
### Initial cells disposition
    Randomly Distributed Cells
    	CONTROL PARAMETERS:
	        Number of Cells
	        Separation Between Cells

    Clusters of Cells
	    CONTROL PARAMETERS:
	        Number of Cells
	        Radius of Disk
	        Separation Between Cells

### Boundary conditions
	Domain/Universe
    	CONTROL PARAMETERS
	    	Domain Size
		    2D/3D
	Fields
        CONTROL PARAMETERS
            Periodic/Absorbing Boundaries 
